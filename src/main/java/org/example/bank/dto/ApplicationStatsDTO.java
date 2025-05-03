package org.example.bank.dto;


import lombok.Data;
import org.example.bank.models.ApplicationStatus;

import java.util.List;
import java.util.Map;

@Data
public class ApplicationStatsDTO {




    public List<FullApplicationInfoDTO> getApplications() {
        return applications;
    }

    public void setApplications(List<FullApplicationInfoDTO> applications) {
        this.applications = applications;
    }

    public long getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(long totalCount) {
        this.totalCount = totalCount;
    }

    private List<FullApplicationInfoDTO> applications; // Список заявок (с фильтрацией)
    private long totalCount; // Общее количество заявок (после фильтрации)

    public ApplicationStatsDTO(
            List<StatusCountDTO> statusCounts,
            List<FullApplicationInfoDTO> applications,
            long totalCount) {
        this.applications = applications;
        this.totalCount = totalCount;
    }
}