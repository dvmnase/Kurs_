package org.example.bank.dto;

import org.example.bank.models.ApplicationStatus;

public class UpdateApplicationStatusDTO {
    private ApplicationStatus status;
    private String comment; // Опциональный комментарий при изменении статуса

    // Геттеры и сеттеры
    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}