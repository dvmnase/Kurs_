package org.example.bank.dto;

import org.example.bank.models.RequestStatus;

public class UpdateRequestStatusDTO {
    private RequestStatus status;

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }
}

