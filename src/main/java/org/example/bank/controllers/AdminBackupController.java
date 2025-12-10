package org.example.bank.controllers;

import org.example.bank.services.BackupService;
import org.example.bank.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/backup")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBackupController {

    @Autowired
    private BackupService backupService;

    @Autowired
    private UserService userService;

    /**
     * Создать резервную копию вручную
     */
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createBackup(Authentication authentication) {
        try {
            String backupPath = backupService.createBackup();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Backup created successfully");
            response.put("path", backupPath);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to create backup: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Получить список всех бэкапов
     */
    @GetMapping("/list")
    public ResponseEntity<List<BackupService.BackupInfo>> listBackups() {
        try {
            List<BackupService.BackupInfo> backups = backupService.listBackups();
            return ResponseEntity.ok(backups);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Скачать бэкап
     */
    @GetMapping("/download/{fileName}")
    public ResponseEntity<Resource> downloadBackup(@PathVariable String fileName) {
        try {
            List<BackupService.BackupInfo> backups = backupService.listBackups();
            BackupService.BackupInfo backup = backups.stream()
                    .filter(b -> b.getFileName().equals(fileName))
                    .findFirst()
                    .orElse(null);

            if (backup == null) {
                return ResponseEntity.notFound().build();
            }

            File file = new File(backup.getFilePath());
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(file);
            String contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Удалить бэкап
     */
    @DeleteMapping("/{fileName}")
    public ResponseEntity<Map<String, Object>> deleteBackup(@PathVariable String fileName) {
        try {
            List<BackupService.BackupInfo> backups = backupService.listBackups();
            BackupService.BackupInfo backup = backups.stream()
                    .filter(b -> b.getFileName().equals(fileName))
                    .findFirst()
                    .orElse(null);

            if (backup == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Backup not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            Files.delete(Paths.get(backup.getFilePath()));

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Backup deleted successfully");
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to delete backup: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Восстановить базу данных из бэкапа
     */
    @PostMapping("/restore/{fileName}")
    public ResponseEntity<Map<String, Object>> restoreBackup(@PathVariable String fileName) {
        try {
            backupService.restoreBackup(fileName);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Database restored successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to restore backup: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Очистить старые бэкапы
     */
    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupOldBackups() {
        try {
            backupService.cleanupOldBackups();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Old backups cleaned up successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to cleanup backups: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

