package org.example.bank.repositories;


import org.example.bank.entities.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Все транзакции, где указанный счет был отправителем
    List<Transaction> findByFromAccountId(Long fromAccountId);

    // Все транзакции, где указанный счет был получателем
    List<Transaction> findByToAccountId(Long toAccountId);

    // Все транзакции по счету — и отправленные, и полученные
    List<Transaction> findByFromAccountIdOrToAccountId(Long fromAccountId, Long toAccountId);

    @Query("SELECT t FROM Transaction t WHERE " +
            "(t.fromAccountId = :accountId OR t.toAccountId = :accountId) " +
            "AND t.createdAt BETWEEN :startDate AND :endDate " +
            "ORDER BY t.createdAt DESC")
    List<Transaction> findByAccountAndDateRange(
            @Param("accountId") Long accountId,
            @Param("startDate") Timestamp startDate,
            @Param("endDate") Timestamp endDate);
}
