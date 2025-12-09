package org.example.bank.controllers;

import org.example.bank.UserDetailsImpl;
import org.example.bank.dto.UpdateUserDTO;
import org.example.bank.services.UserAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/owner/account")
public class OwnerAccountController {

    @Autowired
    private UserAccountService userAccountService;

    private Long getUserId(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getId();
    }

    @PutMapping("/username")
    public ResponseEntity<Void> updateUsername(@RequestParam String username, Authentication authentication) {
        Long userId = getUserId(authentication);
        userAccountService.updateUsername(userId, username);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/password")
    public ResponseEntity<Void> updatePassword(@RequestParam String password, Authentication authentication) {
        Long userId = getUserId(authentication);
        userAccountService.updatePassword(userId, password);
        return ResponseEntity.ok().build();
    }

    @PutMapping
    public ResponseEntity<Void> updateAccount(@RequestBody UpdateUserDTO dto, Authentication authentication) {
        Long userId = getUserId(authentication);
        userAccountService.updateUser(userId, dto);
        return ResponseEntity.ok().build();
    }
}


