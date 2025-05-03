package org.example.bank.dto;

import org.example.bank.models.AccountType;

public class CreateAccountDTO {
    public AccountType getType() {
        return type;
    }

    public void setType(AccountType type) {
        this.type = type;
    }

    private AccountType type;
}
