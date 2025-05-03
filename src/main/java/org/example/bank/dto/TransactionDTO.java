package org.example.bank.dto;

import org.example.bank.models.TransactionType;

import java.sql.Timestamp;

public class TransactionDTO {
    private Long id;
    private Long fromAccountId;
    private Long toAccountId;
    private String toExternal;
    private Double amount;
    private TransactionType type;
    private Timestamp createdAt;

    // Геттеры и сеттеры
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFromAccountId() {
        return fromAccountId;
    }

    public void setFromAccountId(Long fromAccountId) {
        this.fromAccountId = fromAccountId;
    }

    public Long getToAccountId() {
        return toAccountId;
    }

    public void setToAccountId(Long toAccountId) {
        this.toAccountId = toAccountId;
    }

    public String getToExternal() {
        return toExternal;
    }

    public void setToExternal(String toExternal) {
        this.toExternal = toExternal;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }
}