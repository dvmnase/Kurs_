package org.example.bank.controllers;

import org.example.bank.JwtCore;
import org.example.bank.UserDetailsImpl;
import org.example.bank.dto.UpdateUserDTO;
import org.example.bank.services.UserAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/carrier/account")
public class CarrierAccountController {

    @Autowired
    private UserAccountService userAccountService;

    @Autowired
    private JwtCore jwtCore;

    @Autowired
    private UserDetailsService userDetailsService;

    private Long getUserId(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getId();
    }

    @PutMapping("/username")
    public ResponseEntity<Map<String, String>> updateUsername(@RequestParam String username, Authentication authentication) {
        Long userId = getUserId(authentication);
        String oldUsername = ((UserDetailsImpl) authentication.getPrincipal()).getUsername();
        
        userAccountService.updateUsername(userId, username);
        
        // Генерируем новый токен с новым именем пользователя
        UserDetailsImpl newUserDetails = (UserDetailsImpl) userDetailsService.loadUserByUsername(username);
        org.springframework.security.core.Authentication newAuth = 
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                newUserDetails, null, newUserDetails.getAuthorities());
        String newToken = jwtCore.generateToken(newAuth);
        
        Map<String, String> response = new HashMap<>();
        response.put("token", newToken);
        response.put("username", username);
        
        return ResponseEntity.ok(response);
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

