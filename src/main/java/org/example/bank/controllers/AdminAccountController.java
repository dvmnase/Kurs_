package org.example.bank.controllers;

import org.example.bank.dto.AccountResponseDTO;
import org.example.bank.dto.StaticDTO;
import org.example.bank.entities.Account;
import org.example.bank.models.AccountType;
import org.example.bank.services.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/secured/admin/accounts")
@Secured("ROLE_ADMIN")
public class AdminAccountController {

    @Autowired
    private AccountService accountService;

    private AccountResponseDTO convertToDto(Account account) {
        AccountResponseDTO dto = new AccountResponseDTO();
        dto.setId(account.getId());
        dto.setUserId(account.getUser().getId());
        dto.setAccountNumber(account.getAccountNumber());
        dto.setType(account.getType());
        dto.setBalance(account.getBalance());
        dto.setStatus(account.getStatus());
        dto.setOwnerName(account.getUser().getUsername());
        return dto;
    }

    @GetMapping
    public ResponseEntity<List<AccountResponseDTO>> getAllAccounts() {
        List<AccountResponseDTO> accounts = accountService.getAllAccounts().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AccountResponseDTO>> getUserAccounts(@PathVariable Long userId) {
        List<AccountResponseDTO> accounts = accountService.getUserAccounts(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/blocked")
    public ResponseEntity<List<AccountResponseDTO>> getBlockedAccounts() {
        List<AccountResponseDTO> accounts = accountService.getBlockedAccounts().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/active")
    public ResponseEntity<List<AccountResponseDTO>> getActiveAccounts() {
        List<AccountResponseDTO> accounts = accountService.getActiveAccounts().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(accounts);
    }

    @PostMapping("/{accountId}/block")
    public ResponseEntity<AccountResponseDTO> blockAccount(@PathVariable Long accountId) {
        Account account = accountService.blockAccount(accountId);
        return ResponseEntity.ok(convertToDto(account));
    }

    @PostMapping("/{accountId}/unblock")
    public ResponseEntity<AccountResponseDTO> unblockAccount(@PathVariable Long accountId) {
        Account account = accountService.unblockAccount(accountId);
        return ResponseEntity.ok(convertToDto(account));
    }
    @GetMapping("/filter")
    public ResponseEntity<List<AccountResponseDTO>> getAccountsByType(
            @RequestParam AccountType type) {
        List<Account> accounts = accountService.getAccountsByType(type); // Используем сервис
        List<AccountResponseDTO> dtos = accounts.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/static")
    public StaticDTO getAccountsStatic() {
        return accountService.getStats();
    }
}