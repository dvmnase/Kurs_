package org.example.bank.dto;

import lombok.Data;
import org.example.bank.models.AccountType;

@Data
public class UpdateAccountDTO {
    public AccountType getType() {
        return type;
    }

    public void setType(AccountType type) {
        this.type = type;
    }

    private AccountType type;
    // Можно добавить другие поля для обновления
}