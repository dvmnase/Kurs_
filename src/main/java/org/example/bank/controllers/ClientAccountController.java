package org.example.bank.controllers;

import org.example.bank.dto.*;
import org.example.bank.services.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.List;
@RestController
@RequestMapping("/api/accounts")
@Secured("ROLE_USER")
public class ClientAccountController {
    @Autowired
    private AccountService accountService;

    @GetMapping
    public ResponseEntity<List<AccountDTO>> getUserAccounts() {
        return ResponseEntity.ok(accountService.getCurrentUserAccounts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountDTO> getAccountDetails(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.getAccountDetailsForCurrentUser(id));
    }

    @PostMapping
    public ResponseEntity<AccountDTO> createAccount(@RequestBody CreateAccountDTO dto) {
        return ResponseEntity.ok(accountService.createAccountForCurrentUser(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountDTO> updateAccount(
            @PathVariable Long id,
            @RequestBody UpdateAccountDTO dto) {
        return ResponseEntity.ok(accountService.updateAccountForCurrentUser(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> closeAccount(@PathVariable Long id) {
        accountService.closeAccountForCurrentUser(id);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/transfer")
    public ResponseEntity<?> transferBetweenAccounts( @RequestBody InternalTransferDTO dto) {
        try {
            accountService.transferBetweenOwnAccounts(dto.getFromAccountId(), dto.getToAccountId(), dto.getAmount());
            return ResponseEntity.ok(Collections.singletonMap("message", "Transfer successful"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    @PostMapping("/external-transfer")
    public ResponseEntity<?> transferToExternalAccount(@RequestBody ExternalTransferDTO dto) {
        try {
            accountService.transferToExternalAccount(dto.getFromAccountId(), dto.getToExternalAccount(), dto.getAmount());
            return ResponseEntity.ok(Collections.singletonMap("message", "External transfer successful"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    @GetMapping("/{accountId}/transactions")
    public ResponseEntity<List<TransactionDTO>> getAccountTransactions(@PathVariable Long accountId) {
        return ResponseEntity.ok(accountService.getAccountTransactions(accountId));
    }
    @GetMapping("/{accountId}/transactions/filter")
    public ResponseEntity<List<TransactionDTO>> getFilteredTransactions(
            @PathVariable Long accountId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        Timestamp start = parseTimestamp(startDate, new Timestamp(0));
        Timestamp end = parseTimestamp(endDate, new Timestamp(System.currentTimeMillis()));

        return ResponseEntity.ok(
                accountService.getAccountTransactionsByDateRange(accountId, start, end));
    }

    private Timestamp parseTimestamp(String dateStr, Timestamp defaultValue) {
        if (dateStr == null || dateStr.isEmpty()) {
            return defaultValue;
        }
        try {
            Instant instant = Instant.parse(dateStr);
            return Timestamp.from(instant);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date format. Use ISO-8601 format (e.g., 2025-05-01T00:00:00Z)");
        }
    }

}