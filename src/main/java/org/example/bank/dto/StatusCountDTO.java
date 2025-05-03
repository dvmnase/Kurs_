package org.example.bank.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.example.bank.models.ApplicationStatus;

@Data

public class StatusCountDTO {
    public StatusCountDTO(ApplicationStatus status, Long count) {
        this.status = status;
        this.count = count;
    }
    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public Long getCount() {
        return count;
    }

    public void setCount(Long count) {
        this.count = count;
    }

    private ApplicationStatus status;
    private Long count;
}
