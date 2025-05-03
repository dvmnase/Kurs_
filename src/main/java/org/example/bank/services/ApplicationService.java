package org.example.bank.services;

import org.example.bank.dto.CardApplicationDTO;
import org.example.bank.entities.Account;
import org.example.bank.entities.Application;
import org.example.bank.exceptions.ResourceNotFoundException;
import org.example.bank.models.AccountStatus;
import org.example.bank.models.ApplicationStatus;
import org.example.bank.models.ApplicationType;
import org.example.bank.models.User;
import org.example.bank.repositories.AccountRepository;
import org.example.bank.repositories.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserService userService;
    @Transactional
    public void createCardApplication(CardApplicationDTO dto) {
        User currentUser = getCurrentUser();
        Account account = accountRepository.findById(dto.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        if (!account.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Account not found");
        }

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalStateException("Cannot issue card for inactive or blocked account");
        }

        // Проверяем существующие заявки для этого аккаунта
        List<Application> existingApplications = applicationRepository
                .findByAccountIdAndType(account.getId(), ApplicationType.CARD_ISSUE);

        boolean hasActiveApplication = existingApplications.stream()
                .anyMatch(app -> app.getStatus() == ApplicationStatus.NEW
                        || app.getStatus() == ApplicationStatus.IN_PROGRESS );

        if (hasActiveApplication) {
            throw new IllegalStateException("Active card application already exists for this account");
        }

        Application application = new Application();
        application.setUserId(currentUser.getId());
        application.setType(ApplicationType.CARD_ISSUE);
        application.setAccountId(account.getId());
        application.setStatus(ApplicationStatus.NEW);
        application.setComment(dto.getComment());
        application.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        applicationRepository.save(application);
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public List<Application> getUserApplications() {
        User currentUser = getCurrentUser();
        return applicationRepository.findByUserId(currentUser.getId());
    }

    @Transactional(readOnly = true)
    public Application getUserApplicationById(Long id) {
        User currentUser = getCurrentUser();
        return applicationRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found or access denied"));
    }
}