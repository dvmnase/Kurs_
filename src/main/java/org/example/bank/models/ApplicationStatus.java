package org.example.bank.models;

public enum ApplicationStatus {
    NEW("Новая"),
    IN_PROGRESS("В обработке"),
    APPROVED("Одобрена"),
    REJECTED("Отклонена");

    private final String description;

    ApplicationStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}