package org.example.bank.dto;

import lombok.Data;

@Data
public class UserSettingsDTO {
    private String fullName;
    private String email;
    private String phone;
    private String currentPassword;
    private String newPassword;
} 