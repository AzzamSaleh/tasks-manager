package com.tasksmanager.backend.feature.user.repository;

import com.tasksmanager.backend.feature.user.entity.User;
import com.tasksmanager.backend.feature.user.enums.RoleEnum;
import com.tasksmanager.backend.feature.user.enums.UserStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/*
 * Provides persistence operations for User accounts.
 */
public interface UserRepository
        extends JpaRepository<User, Long> {

    /*
     * Used during login and authenticated-user lookup.
     */
    Optional<User> findByUsername(
            String username
    );

    /*
     * Used to validate duplicate usernames.
     */
    boolean existsByUsername(
            String username
    );

    /*
     * Used to validate duplicate email addresses.
     */
    boolean existsByEmail(
            String email
    );

    /*
     * Prevents deleting or deactivating the final
     * active Admin account.
     */
    long countByRoleAndStatus(
            RoleEnum role,
            UserStatusEnum status
    );

    /*
     * Returns all users with the specified role and status.
     *
     * NotificationService uses this method to find all
     * active Admin recipients.
     */
    List<User> findAllByRoleAndStatus(
            RoleEnum role,
            UserStatusEnum status
    );

    /*
     * Searches by username, full name, or email.
     *
     * Role and status are optional filters.
     * A null filter means that the filter is ignored.
     */
    @Query("""
            SELECT user
            FROM User user
            WHERE (
                :search IS NULL
                OR LOWER(user.username)
                    LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(user.fullName)
                    LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(user.email)
                    LIKE LOWER(CONCAT('%', :search, '%'))
            )
            AND (
                :role IS NULL
                OR user.role = :role
            )
            AND (
                :status IS NULL
                OR user.status = :status
            )
            """)
    Page<User> searchUsers(
            @Param("search")
            String search,

            @Param("role")
            RoleEnum role,

            @Param("status")
            UserStatusEnum status,

            Pageable pageable
    );

    /*
     * Checks whether another user already uses
     * the specified username.
     */
    boolean existsByUsernameAndIdNot(
            String username,
            Long id
    );

    /*
     * Checks whether another user already uses
     * the specified email.
     */
    boolean existsByEmailAndIdNot(
            String email,
            Long id
    );

    /*
     * Used by the Admin dashboard.
     */
    long countByStatus(
            UserStatusEnum status
    );
}

