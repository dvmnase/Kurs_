package org.example.bank.dto;

public class CardApplicationDTO {
    private Long accountId;
    private String comment;

    // Геттеры и сеттеры
    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}