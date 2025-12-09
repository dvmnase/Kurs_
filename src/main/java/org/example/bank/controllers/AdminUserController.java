package org.example.bank.controllers;

import org.example.bank.dto.UpdateUserRequest;
import org.example.bank.dto.UserDTO;
import org.example.bank.models.Role;
import org.example.bank.models.User;
import org.example.bank.services.UserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    @Autowired
    private UserManagementService userManagementService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userManagementService.getAllUsers().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        return userManagementService.getUserById(id)
                .map(user -> ResponseEntity.ok(convertToDTO(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        User user = userManagementService.updateUser(id, request.getUsername(), request.getEmail(), request.getRole());
        
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            userManagementService.resetUserPassword(id, request.getPassword());
        }
        
        return ResponseEntity.ok(convertToDTO(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userManagementService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        userManagementService.resetUserPassword(id, request.getPassword());
        return ResponseEntity.ok().build();
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
