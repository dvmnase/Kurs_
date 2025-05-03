package org.example.bank.controllers;


import org.example.bank.dto.CardApplicationDTO;
import org.example.bank.entities.Application;
import org.example.bank.exceptions.ResourceNotFoundException;
import org.example.bank.services.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@Secured("ROLE_USER")
public class ClientApplicationController {
    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/card")
    public ResponseEntity<?> createCardApplication(@RequestBody CardApplicationDTO dto) {
        try {
            applicationService.createCardApplication(dto);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping
    public ResponseEntity<List<Application>> getUserApplications() {
        List<Application> applications = applicationService.getUserApplications();
        return ResponseEntity.ok(applications);
    }

    // Получить заявку по ID (если она принадлежит текущему пользователю)
    @GetMapping("/{id}")
    public ResponseEntity<Application> getApplicationById(@PathVariable Long id) {
        try {
            Application application = applicationService.getUserApplicationById(id);
            return ResponseEntity.ok(application);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
