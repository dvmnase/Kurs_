package org.example.bank.entities;


import jakarta.persistence.*;
import lombok.Data;
import org.example.bank.models.TransactionType;

import java.sql.Timestamp;

@Entity
@Table(name = "transactions")
@Data
public class Transaction {

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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_account_id", nullable = false)
    private Long fromAccountId;

    @Column(name = "to_account_id")
    private Long toAccountId;

    @Column(nullable = false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type; // INTERNAL или EXTERNAL

    @Column(name = "created_at", nullable = false)
    private Timestamp createdAt;

    public String getTo_external() {
        return to_external;
    }

    public void setTo_external(String to_external) {
        this.to_external = to_external;
    }

    private String to_external;
}