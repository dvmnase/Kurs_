package org.example.bank.repositories;

import org.example.bank.entities.Account;
import org.example.bank.models.AccountStatus;
import org.example.bank.models.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByUserId(Long userId);
    Optional<Account> findByAccountNumber(String accountNumber);
    List<Account> findByStatus(AccountStatus status);
    List<Account> findByType(AccountType type);
    List<Account> findByUserIdAndStatus(Long userId, AccountStatus status);
    long count();
    long countByStatus(AccountStatus status);
    @Query("SELECT COUNT(a) FROM Account a WHERE a.status = :status")
    long countAccountsByStatus(AccountStatus status);

}