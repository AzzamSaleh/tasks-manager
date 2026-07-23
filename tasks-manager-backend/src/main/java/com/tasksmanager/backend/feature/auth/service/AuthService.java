package com.tasksmanager.backend.feature.auth.service;
import com.tasksmanager.backend.feature.activitylog.enums.ActivityActionEnum;
import com.tasksmanager.backend.feature.activitylog.service.ActivityLogService;
import com.tasksmanager.backend.feature.auth.dto.LoginRequest;
import com.tasksmanager.backend.feature.auth.dto.LoginResponse;
import com.tasksmanager.backend.feature.user.entity.User;
import com.tasksmanager.backend.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import com.tasksmanager.backend.feature.user.exception.UserNotFoundException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;


/*
 * Handles the login,logout business logic.
 */
@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final ActivityLogService activityLogService;

    @Autowired
    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtService jwtService,
            ActivityLogService activityLogService
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.activityLogService = activityLogService;
    }

    public LoginResponse login(LoginRequest request) {

        /*
         * Spring Security loads the user and compares the submitted
         * password with the BCrypt password stored in MySQL.
         */
        authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Invalid username or password"
                        )
                );

        String token = jwtService.generateAccessToken(user);

        activityLogService.createActivityLog(
                user,
                ActivityActionEnum.LOGIN,
                "AUTHENTICATION",
                user.getId(),
                "User logged in successfully."
        );
        return new LoginResponse(
                token,
                "Bearer",
                user.getUsername(),
                user.getFullName(),
                user.getRole().name()
        );
    }


    /*
     * Records a successful logout.
     *
     * JWT authentication is stateless, so the frontend is responsible
     * for deleting its local access token after this endpoint succeeds.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @Transactional
    public void logout(String currentUsername) {

        User user = userRepository
                .findByUsername(currentUsername)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found.")
                );

        activityLogService.createActivityLog(
                user,
                ActivityActionEnum.LOGOUT,
                "AUTHENTICATION",
                user.getId(),
                "User logged out successfully."
        );
    }
}
