package org.example.bank.dto;

public class ExternalTransferDTO {
    private Long fromAccountId;

    public Long getFromAccountId() {
        return fromAccountId;
    }

    public void setFromAccountId(Long fromAccountId) {
        this.fromAccountId = fromAccountId;
    }

    public String getToExternalAccount() {
        return toExternalAccount;
    }

    public void setToExternalAccount(String toExternalAccount) {
        this.toExternalAccount = toExternalAccount;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    private String toExternalAccount;
    private Double amount;


}