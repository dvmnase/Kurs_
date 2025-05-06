package org.example.bank.dto;

public class StaticDTO {
    private int count_accounts;

    public int getCount_accounts() {
        return count_accounts;
    }

    public void setCount_accounts(int count_accounts) {
        this.count_accounts = count_accounts;
    }

    public int getCount_active_accounts() {
        return count_active_accounts;
    }

    public void setCount_active_accounts(int count_active_accounts) {
        this.count_active_accounts = count_active_accounts;
    }

    private int count_active_accounts;
}