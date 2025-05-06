package org.example.bank.services;

import org.example.bank.dto.*;
import org.example.bank.entities.Account;
import org.example.bank.entities.Transaction;
import org.example.bank.exceptions.ResourceNotFoundException;
import org.example.bank.models.AccountStatus;
import org.example.bank.models.AccountType;
import org.example.bank.models.TransactionType;
import org.example.bank.models.User;
import org.example.bank.repositories.AccountRepository;
import org.example.bank.repositories.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private TransactionRepository transactionRepository;

    // Административные методы
    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public List<Account> getUserAccounts(Long userId) {
        return accountRepository.findByUserId(userId);
    }

    public Account getAccountById(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + id));
    }

    public Account blockAccount(Long accountId) {
        Account account = getAccountById(accountId);
        account.setStatus(AccountStatus.BLOCKED);
        return accountRepository.save(account);
    }

    public Account unblockAccount(Long accountId) {
        Account account = getAccountById(accountId);
        account.setStatus(AccountStatus.ACTIVE);
        return accountRepository.save(account);
    }

    public List<Account> getBlockedAccounts() {
        return accountRepository.findByStatus(AccountStatus.BLOCKED);
    }

    public List<Account> getActiveAccounts() {
        return accountRepository.findByStatus(AccountStatus.ACTIVE);
    }

    public List<Account> getAccountsByType(AccountType type) {
        return accountRepository.findByType(type);
    }

    // Пользовательские методы
    private AccountDTO convertToDto(Account account) {
        AccountDTO dto = new AccountDTO();
        dto.setId(account.getId());
        dto.setAccountNumber(account.getAccountNumber());
        dto.setType(account.getType());
        dto.setBalance(account.getBalance());
        dto.setStatus(account.getStatus());
        return dto;
    }

    public StaticDTO getStats(){
        long totalAccounts = accountRepository.count();
        long activeAccounts = accountRepository.countByStatus(AccountStatus.ACTIVE);
        StaticDTO stats = new StaticDTO();
        stats.setCount_accounts((int) totalAccounts);
        stats.setCount_active_accounts((int) activeAccounts);

        return stats;
    }
    public List<AccountDTO> getCurrentUserAccounts() {
        User currentUser = getCurrentUser();
        return accountRepository.findByUserId(currentUser.getId()).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public AccountDTO getAccountDetailsForCurrentUser(Long accountId) {
        User currentUser = getCurrentUser();
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        if (!account.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Account not found");
        }

        return convertToDto(account);
    }

    @Transactional
    public AccountDTO createAccountForCurrentUser(CreateAccountDTO dto) {
        User currentUser = getCurrentUser();

        Account account = new Account();
        account.setUser(currentUser);
        account.setType(dto.getType());
        account.setAccountNumber(generateAccountNumber());
        account.setBalance(0.0);
        account.setStatus(AccountStatus.ACTIVE);

        Account savedAccount = accountRepository.save(account);
        return convertToDto(savedAccount);
    }

    @Transactional
    public void closeAccountForCurrentUser(Long accountId) {
        User currentUser = getCurrentUser();
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        if (!account.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Account not found");
        }

        if (account.getBalance() != 0) {
            throw new IllegalStateException("Cannot close account with non-zero balance");
        }

        accountRepository.delete(account);
    }

    @Transactional
    public AccountDTO updateAccountForCurrentUser(Long accountId, UpdateAccountDTO dto) {
        User currentUser = getCurrentUser();
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        if (!account.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Account not found");
        }

        // Обновляем только разрешенные поля
        if (dto.getType() != null) {
            account.setType(dto.getType());
        }

        Account updatedAccount = accountRepository.save(account);
        return convertToDto(updatedAccount);
    }

    // Вспомогательные методы
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String generateAccountNumber() {
        Random random = new Random();
        return "UA" + String.format("%016d", random.nextLong(10000000000000000L));
    }
    @Transactional
    public void transferBetweenOwnAccounts(Long fromAccountId, Long toAccountId, Double amount) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Transfer amount must be positive");
        }

        User currentUser = getCurrentUser();
        Account from = accountRepository.findById(fromAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found"));
        Account to = accountRepository.findById(toAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found"));

        if (!from.getUser().getId().equals(currentUser.getId())) {
            throw new SecurityException("You don't have access to the source account");
        }

        if (!to.getUser().getId().equals(currentUser.getId())) {
            throw new SecurityException("You can't transfer to another user's account");
        }

        if (from.getStatus() == AccountStatus.BLOCKED) {
            throw new IllegalStateException("Source account is BLOCKED");
        }

        if (to.getStatus() == AccountStatus.BLOCKED) {
            throw new IllegalStateException("Destination account is BLOCKED");
        }

        if (from.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalStateException("Source account is not active");
        }

        if (to.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalStateException("Destination account is not active");
        }

        if (fromAccountId.equals(toAccountId)) {
            throw new IllegalArgumentException("Cannot transfer to the same account");
        }

        if (from.getBalance() < amount) {
            throw new IllegalStateException(
                    String.format("Insufficient funds. Available: %.2f, requested: %.2f",
                            from.getBalance(), amount)
            );
        }

        from.setBalance(from.getBalance() - amount);
        to.setBalance(to.getBalance() + amount);

        accountRepository.save(from);
        accountRepository.save(to);

        Transaction transaction = new Transaction();
        transaction.setFromAccountId(from.getId());
        transaction.setToAccountId(to.getId());
        transaction.setAmount(amount);
        transaction.setType(TransactionType.INTERNAL);
        transaction.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        transactionRepository.save(transaction);
    }

    @Transactional
    public void transferToExternalAccount(Long fromAccountId, String toExternalAccount, Double amount) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Transfer amount must be positive");
        }

        if (toExternalAccount == null || toExternalAccount.isBlank()) {
            throw new IllegalArgumentException("External account number is required");
        }

        User currentUser = getCurrentUser();
        Account fromAccount = accountRepository.findById(fromAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found"));

        if (!fromAccount.getUser().getId().equals(currentUser.getId())) {
            throw new SecurityException("Access denied to source account");
        }

        if (fromAccount.getStatus() == AccountStatus.BLOCKED) {
            throw new IllegalStateException("Source account is BLOCKED");
        }

        if (fromAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalStateException("Source account is not active");
        }

        Account toAccount = accountRepository.findByAccountNumber(toExternalAccount)
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found"));

        if (toAccount.getStatus() == AccountStatus.BLOCKED) {
            throw new IllegalStateException("Destination account is BLOCKED");
        }

        if (toAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalStateException("Destination account is not active");
        }

        if (fromAccount.getBalance() < amount) {
            throw new IllegalStateException(
                    String.format("Insufficient funds. Available: %.2f, Required: %.2f",
                            fromAccount.getBalance(), amount)
            );
        }

        fromAccount.setBalance(fromAccount.getBalance() - amount);
        accountRepository.save(fromAccount);

        Transaction transaction = new Transaction();
        transaction.setFromAccountId(fromAccount.getId());
        transaction.setTo_external(toExternalAccount);
        transaction.setAmount(amount);
        transaction.setType(TransactionType.EXTERNAL);
        transaction.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        transactionRepository.save(transaction);
    }
    public List<TransactionDTO> getAccountTransactions(Long accountId) {
        User currentUser = getCurrentUser();
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        if (!account.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Account not found");
        }

        List<Transaction> transactions = transactionRepository.findByFromAccountIdOrToAccountId(accountId, accountId);

        return transactions.stream()
                .map(this::convertTransactionToDto)
                .collect(Collectors.toList());
    }
    private TransactionDTO convertTransactionToDto(Transaction transaction) {
        TransactionDTO dto = new TransactionDTO();
        dto.setId(transaction.getId());
        dto.setFromAccountId(transaction.getFromAccountId());
        dto.setToAccountId(transaction.getToAccountId());
        dto.setToExternal(transaction.getTo_external());
        dto.setAmount(transaction.getAmount());
        dto.setType(transaction.getType());
        dto.setCreatedAt(transaction.getCreatedAt());
        return dto;
    }
    public List<TransactionDTO> getAccountTransactionsByDateRange(Long accountId, Timestamp startDate, Timestamp endDate) {
        User currentUser = getCurrentUser();
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        if (!account.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Account not found");
        }

        List<Transaction> transactions = transactionRepository
                .findByAccountAndDateRange(accountId, startDate, endDate);

        return transactions.stream()
                .map(this::convertTransactionToDto)
                .collect(Collectors.toList());
    }



}