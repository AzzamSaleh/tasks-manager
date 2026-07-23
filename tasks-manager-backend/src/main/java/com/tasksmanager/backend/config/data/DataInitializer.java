package com.tasksmanager.backend.config.data;

import com.tasksmanager.backend.feature.user.enums.RoleEnum;
import com.tasksmanager.backend.feature.user.enums.UserStatusEnum;
import com.tasksmanager.backend.feature.user.entity.User;
import com.tasksmanager.backend.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/*
 * Creates the first Admin account when the application starts.
 * It only creates the account when the username does not already exist.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.default-admin.username}")
    private String username;

    @Value("${app.default-admin.password}")
    private String password;

    @Value("${app.default-admin.full-name}")
    private String fullName;

    @Value("${app.default-admin.email}")
    private String email;

    @Autowired
    public DataInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // Prevents creating the Admin again after every restart.
        if (userRepository.existsByUsername(username)) {
            return;
        }

        User admin = new User();

        admin.setUsername(username);
        admin.setFullName(fullName);
        admin.setEmail(email);

        // The original password is never stored in the database.
        admin.setPassword(passwordEncoder.encode(password));

        admin.setRole(RoleEnum.ADMIN);
        admin.setStatus(UserStatusEnum.ACTIVE);

        userRepository.save(admin);
    }
}