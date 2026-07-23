package com.tasksmanager.backend.feature.activitylog.repository;

import com.tasksmanager.backend.feature.activitylog.entity.ActivityLog;
import com.tasksmanager.backend.feature.activitylog.enums.ActivityActionEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/*
 * Provides database operations and filtering
 * for activity-log records.
 */
public interface ActivityLogRepository
        extends JpaRepository<ActivityLog, Long> {
    /*
     * Returns the five newest activity records
     * for the Admin dashboard.
     */
    List<ActivityLog> findTop5ByOrderByCreatedAtDesc();

    /*
     * Supports optional search and action filtering.
     */
    @Query("""
            SELECT log
            FROM ActivityLog log
            WHERE (
                :search IS NULL
                OR LOWER(log.actorUsername) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(log.entityType) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(log.description) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            AND (:action IS NULL OR log.action = :action)
            """)
    Page<ActivityLog> searchActivityLogs(
            @Param("search") String search,
            @Param("action") ActivityActionEnum action,
            Pageable pageable
    );
}
