package org.example.bank.models;

public enum ApplicationType {
    CARD_ISSUE("Выпуск карты"),
    ACCOUNT_CLOSE("Закрытие счета");

    private final String description;

    ApplicationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}