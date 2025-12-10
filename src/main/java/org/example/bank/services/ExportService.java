package org.example.bank.services;

import org.example.bank.entities.ExportLog;
import org.example.bank.models.ExportType;
import org.example.bank.models.User;
import org.example.bank.repositories.ExportLogRepository;
import org.example.bank.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExportService {

    @Autowired
    private ExportLogRepository exportLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void logExport(Long userId, ExportType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ExportLog log = new ExportLog();
        log.setUser(user);
        log.setType(type);
        exportLogRepository.save(log);
    }
}




