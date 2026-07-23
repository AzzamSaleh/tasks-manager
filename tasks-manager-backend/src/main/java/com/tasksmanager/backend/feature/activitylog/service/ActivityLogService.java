package com.tasksmanager.backend.feature.activitylog.service;

import com.tasksmanager.backend.common.exception.InvalidRequestException;
import com.tasksmanager.backend.feature.activitylog.dto.ActivityLogResponse;
import com.tasksmanager.backend.feature.activitylog.entity.ActivityLog;
import com.tasksmanager.backend.feature.activitylog.enums.ActivityActionEnum;
import com.tasksmanager.backend.feature.activitylog.repository.ActivityLogRepository;
import com.tasksmanager.backend.feature.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/*
 * Creates and retrieves system activity records.
 */
@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Autowired
    public ActivityLogService(
            ActivityLogRepository activityLogRepository
    ) {
        this.activityLogRepository = activityLogRepository;
    }

    /*
     * Records an important action performed by a user.
     *
     * REQUIRES_NEW gives the activity log its own transaction.
     * This prevents logging from changing the main operation's transaction.
     */
    @Transactional
    public void createActivityLog(
            User actor,
            ActivityActionEnum action,
            String entityType,
            Long entityId,
            String description
    ) {
        ActivityLog activityLog = new ActivityLog();

        activityLog.setActorUsername(actor.getUsername());
        activityLog.setActorRole(actor.getRole().name());
        activityLog.setAction(action);
        activityLog.setEntityType(entityType);
        activityLog.setEntityId(entityId);
        activityLog.setDescription(description);

        activityLogRepository.save(activityLog);
    }

    /*
     * Returns activity records using pagination
     * and optional search/action filters.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<ActivityLogResponse> getActivityLogs(
            String search,
            ActivityActionEnum action,
            int page,
            int size
    ) {
        validatePagination(page, size);

        String normalizedSearch =
                search == null || search.isBlank()
                        ? null
                        : search.trim();

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                )
        );

        return activityLogRepository
                .searchActivityLogs(
                        normalizedSearch,
                        action,
                        pageable
                )
                .map(this::convertToResponse);
    }

    private void validatePagination(int page, int size) {

        if (page < 0) {
            throw new InvalidRequestException(
                    "Page number cannot be negative."
            );
        }

        if (size < 1 || size > 100) {
            throw new InvalidRequestException(
                    "Page size must be between 1 and 100."
            );
        }
    }

    private ActivityLogResponse convertToResponse(
            ActivityLog activityLog
    ) {
        return new ActivityLogResponse(
                activityLog.getId(),
                activityLog.getActorUsername(),
                activityLog.getActorRole(),
                activityLog.getAction().name(),
                activityLog.getEntityType(),
                activityLog.getEntityId(),
                activityLog.getDescription(),
                activityLog.getCreatedAt()
        );
    }
}
