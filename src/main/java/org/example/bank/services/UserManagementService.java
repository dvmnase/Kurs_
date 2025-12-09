package org.example.bank.services;

import org.example.bank.models.Role;
import org.example.bank.models.User;
import org.example.bank.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserManagementService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    @Transactional
    public User updateUser(Long id, String username, String email, Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (username != null && !username.isEmpty()) {
            if (userRepository.existsByUsername(username) && !user.getUsername().equals(username)) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(username);
        }

        if (email != null && !email.isEmpty()) {
            if (userRepository.existsByEmail(email) && !user.getEmail().equals(email)) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(email);
        }

        if (role != null) {
            user.setRole(role);
        }

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }

    @Transactional
    public User resetUserPassword(Long id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }
}


