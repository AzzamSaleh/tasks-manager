package com.tasksmanager.backend.feature.auth.service;

import com.tasksmanager.backend.feature.user.entity.User;
import com.tasksmanager.backend.feature.user.enums.UserStatusEnum;
import com.tasksmanager.backend.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/*
 * Spring Security calls this service during authentication.
 *
 * Its responsibility is to:
 * 1. Find the user in the database.
 * 2. Return the username, hashed password, role, and account status
 *    in the format expected by Spring Security.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    /*
     * Constructor injection provides the repository required
     * to load users from MySQL.
     */
    @Autowired
    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /*
     * Spring Security calls this method using the username
     * submitted from the login request.
     */
    @Override
    public UserDetails loadUserByUsername(String username) {


        User user = userRepository.findByUsername(username)

                .orElseThrow(() ->
                        /*
                         * A general message is used so attackers cannot know
                         * whether a username exists.
                         */
                        new UsernameNotFoundException("Invalid username or password")
                );
        /*
         * Converts our User entity into Spring Security's UserDetails object.
         */
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole().name())
                /*
                 * An inactive user exists in the database,
                 * but Spring Security will prevent authentication.
                 */
                .disabled(user.getStatus() == UserStatusEnum.INACTIVE)
                .build();
    }
}
