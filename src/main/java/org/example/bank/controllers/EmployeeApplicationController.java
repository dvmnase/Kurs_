package org.example.bank.controllers;

import org.example.bank.dto.ApplicationStatsDTO;
import org.example.bank.dto.FullApplicationInfoDTO;
import org.example.bank.dto.UpdateApplicationStatusDTO;
import org.example.bank.entities.Application;
import org.example.bank.exceptions.ResourceNotFoundException;
import org.example.bank.models.ApplicationStatus;
import org.example.bank.services.EmployeeApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Pageable;
import java.util.List;

@RestController
@RequestMapping("/api/employee/applications")
@Secured("ROLE_EMPLOYEE")
public class EmployeeApplicationController {

    @Autowired
    private EmployeeApplicationService employeeApplicationService;

    // Получить все заявки
    @GetMapping
    public ResponseEntity<List<FullApplicationInfoDTO>> getAllApplications() {
        List<FullApplicationInfoDTO> applications = employeeApplicationService.getAllApplications();
        return ResponseEntity.ok(applications);
    }

    // Получить заявку по ID с полной информацией
    @GetMapping("/{id}")
    public ResponseEntity<FullApplicationInfoDTO> getApplicationById(@PathVariable Long id) {
        try {
            FullApplicationInfoDTO application = employeeApplicationService.getApplicationById(id);
            return ResponseEntity.ok(application);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Обновить статус заявки
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateApplicationStatus(
            @PathVariable Long id,
            @RequestBody UpdateApplicationStatusDTO dto) {
        try {
            employeeApplicationService.updateApplicationStatus(id, dto);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<ApplicationStatsDTO> getApplicationsStats(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        ApplicationStatsDTO stats = employeeApplicationService.getApplicationStats(status, pageable);
        return ResponseEntity.ok(stats);
    }

}