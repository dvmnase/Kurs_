package org.example.bank.services;

import org.example.bank.dto.ApplicationStatsDTO;
import org.example.bank.dto.FullApplicationInfoDTO;
import org.example.bank.dto.StatusCountDTO;
import org.example.bank.dto.UpdateApplicationStatusDTO;
import org.example.bank.entities.*;
import org.example.bank.exceptions.ResourceNotFoundException;
import org.example.bank.models.ApplicationStatus;
import org.example.bank.models.User;
import org.example.bank.repositories.AccountRepository;
import org.example.bank.repositories.ApplicationRepository;
import org.example.bank.repositories.ClientRepository;
import org.hibernate.query.Page;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Pageable;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EmployeeApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private UserService userService;

    @Transactional(readOnly = true)
    public List<FullApplicationInfoDTO> getAllApplications() {
        return applicationRepository.findAll().stream()
                .map(app -> {
                    Account account = accountRepository.findById(app.getAccountId()).orElse(null);
                    User user = userService.findById(app.getUserId()).orElse(null);
                    Client client = user != null ? clientRepository.findByUser(user).orElse(null) : null;
                    return new FullApplicationInfoDTO(app, account, client, user);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FullApplicationInfoDTO getApplicationById(Long id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        return convertToFullInfoDTO(application);
    }

    @Transactional
    public void updateApplicationStatus(Long id, UpdateApplicationStatusDTO dto) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        ApplicationStatus newStatus = dto.getStatus();

        // Проверка допустимости перехода статуса
        if (application.getStatus() == ApplicationStatus.APPROVED
                || application.getStatus() == ApplicationStatus.REJECTED) {
            throw new IllegalStateException("Cannot change status from " + application.getStatus());
        }

        application.setStatus(newStatus);
        application.setUpdatedAt(new Timestamp(System.currentTimeMillis()));

        // Если заявка одобрена, можно выполнить дополнительные действия
        if (newStatus == ApplicationStatus.APPROVED) {
            processApprovedApplication(application);
        }

        applicationRepository.save(application);
    }

    private FullApplicationInfoDTO convertToFullInfoDTO(Application application) {
        Account account = accountRepository.findById(application.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        User user = userService.findById(application.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Client client = clientRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found"));

        return new FullApplicationInfoDTO(application, account, client, user);
    }

    private void processApprovedApplication(Application application) {
        // Логика обработки одобренной заявки
        // Например, создание карты для аккаунта
    }

    @Transactional(readOnly = true)
    public ApplicationStatsDTO getApplicationStats(ApplicationStatus filterStatus, Pageable pageable) {
        // 1. Получаем статистику по статусам
        List<StatusCountDTO> statusCounts = applicationRepository.countByStatusGrouped()
                .stream()
                .map(map -> new StatusCountDTO(
                        (ApplicationStatus) map.get("status"),
                        (Long) map.get("count")
                ))
                .toList();

        // 2. Фильтруем заявки (если передан статус)
        List<FullApplicationInfoDTO> applications;
        long totalCount;

        if (filterStatus != null) {
            var filteredPage = applicationRepository.findByStatus(filterStatus, pageable);
            applications = filteredPage.getContent().stream()
                    .map(this::convertToFullInfoDTO)
                    .toList();
            totalCount = filteredPage.getTotalElements();
        } else {
            var allPage = applicationRepository.findAll(pageable);
            applications = allPage.getContent().stream()
                    .map(this::convertToFullInfoDTO)
                    .toList();
            totalCount = allPage.getTotalElements();
        }

        return new ApplicationStatsDTO(statusCounts, applications, totalCount);
    }

}