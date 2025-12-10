package org.example.bank.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Stream;

@Service
public class BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${backup.directory:backups}")
    private String backupDirectory;

    @Value("${backup.retention.days:30}")
    private int retentionDays;

    /**
     * Извлекает имя базы данных из JDBC URL
     */
    private String extractDatabaseName(String jdbcUrl) {
        // jdbc:postgresql://localhost:5432/kursovaya_cargo
        String[] parts = jdbcUrl.split("/");
        if (parts.length > 0) {
            return parts[parts.length - 1];
        }
        return "kursovaya_cargo";
    }

    /**
     * Извлекает хост и порт из JDBC URL
     */
    private String extractHostAndPort(String jdbcUrl) {
        // jdbc:postgresql://localhost:5432/kursovaya_cargo
        String[] parts = jdbcUrl.replace("jdbc:postgresql://", "").split("/");
        if (parts.length > 0) {
            return parts[0];
        }
        return "localhost:5432";
    }

    /**
     * Создает резервную копию базы данных
     */
    public String createBackup() throws IOException, InterruptedException {
        String dbName = extractDatabaseName(dbUrl);
        String hostPort = extractHostAndPort(dbUrl);
        String[] hostPortParts = hostPort.split(":");
        String host = hostPortParts[0];
        String port = hostPortParts.length > 1 ? hostPortParts[1] : "5432";

        // Создаем директорию для бэкапов, если её нет
        Path backupPath = Paths.get(backupDirectory);
        if (!Files.exists(backupPath)) {
            Files.createDirectories(backupPath);
            logger.info("Created backup directory: {}", backupDirectory);
        }

        // Генерируем имя файла с датой и временем
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss");
        String timestamp = dateFormat.format(new Date());
        String backupFileName = String.format("backup_%s_%s.sql", dbName, timestamp);
        Path backupFile = backupPath.resolve(backupFileName);

        // Формируем команду pg_dump
        List<String> command = new ArrayList<>();
        command.add("pg_dump");
        command.add("-h");
        command.add(host);
        command.add("-p");
        command.add(port);
        command.add("-U");
        command.add(dbUsername);
        command.add("-d");
        command.add(dbName);
        command.add("-F");
        command.add("c"); // custom format
        command.add("-f");
        command.add(backupFile.toAbsolutePath().toString());

        // Устанавливаем переменную окружения для пароля
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.environment().put("PGPASSWORD", dbPassword);
        processBuilder.redirectErrorStream(true);

        logger.info("Starting database backup: {}", backupFileName);

        Process process = processBuilder.start();

        // Читаем вывод процесса
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                logger.debug("pg_dump output: {}", line);
            }
        }

        int exitCode = process.waitFor();

        if (exitCode == 0) {
            long fileSize = Files.size(backupFile);
            logger.info("Backup created successfully: {} ({} bytes)", backupFileName, fileSize);
            return backupFile.toAbsolutePath().toString();
        } else {
            Files.deleteIfExists(backupFile);
            throw new IOException("Backup failed with exit code: " + exitCode);
        }
    }

    /**
     * Автоматическое резервное копирование каждый день в 2:00 ночи
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void scheduledBackup() {
        try {
            logger.info("Starting scheduled backup");
            String backupPath = createBackup();
            logger.info("Scheduled backup completed: {}", backupPath);
            cleanupOldBackups();
        } catch (Exception e) {
            logger.error("Scheduled backup failed", e);
        }
    }

    /**
     * Удаляет старые бэкапы (старше retentionDays дней)
     */
    public void cleanupOldBackups() {
        try {
            Path backupPath = Paths.get(backupDirectory);
            if (!Files.exists(backupPath)) {
                return;
            }

            long cutoffTime = System.currentTimeMillis() - (retentionDays * 24L * 60 * 60 * 1000);
            int deletedCount = 0;

            try (Stream<Path> paths = Files.list(backupPath)) {
                for (Path path : paths.toArray(Path[]::new)) {
                    if (Files.isRegularFile(path) && path.getFileName().toString().startsWith("backup_")) {
                        long fileTime = Files.getLastModifiedTime(path).toMillis();
                        if (fileTime < cutoffTime) {
                            Files.delete(path);
                            deletedCount++;
                            logger.info("Deleted old backup: {}", path.getFileName());
                        }
                    }
                }
            }

            if (deletedCount > 0) {
                logger.info("Cleaned up {} old backup(s)", deletedCount);
            }
        } catch (IOException e) {
            logger.error("Error cleaning up old backups", e);
        }
    }

    /**
     * Получает список всех доступных бэкапов
     */
    public List<BackupInfo> listBackups() throws IOException {
        List<BackupInfo> backups = new ArrayList<>();
        Path backupPath = Paths.get(backupDirectory);

        if (!Files.exists(backupPath)) {
            return backups;
        }

        try (Stream<Path> paths = Files.list(backupPath)) {
            for (Path path : paths.toArray(Path[]::new)) {
                if (Files.isRegularFile(path) && path.getFileName().toString().startsWith("backup_")) {
                    BackupInfo info = new BackupInfo();
                    info.setFileName(path.getFileName().toString());
                    info.setFilePath(path.toAbsolutePath().toString());
                    info.setFileSize(Files.size(path));
                    info.setCreatedAt(new Date(Files.getLastModifiedTime(path).toMillis()));
                    backups.add(info);
                }
            }
        }

        backups.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return backups;
    }

    /**
     * Восстанавливает базу данных из бэкапа
     */
    public void restoreBackup(String backupFileName) throws IOException, InterruptedException {
        String dbName = extractDatabaseName(dbUrl);
        String hostPort = extractHostAndPort(dbUrl);
        String[] hostPortParts = hostPort.split(":");
        String host = hostPortParts[0];
        String port = hostPortParts.length > 1 ? hostPortParts[1] : "5432";

        Path backupFile = Paths.get(backupDirectory, backupFileName);
        if (!Files.exists(backupFile)) {
            throw new FileNotFoundException("Backup file not found: " + backupFileName);
        }

        // Формируем команду pg_restore
        List<String> command = new ArrayList<>();
        command.add("pg_restore");
        command.add("-h");
        command.add(host);
        command.add("-p");
        command.add(port);
        command.add("-U");
        command.add(dbUsername);
        command.add("-d");
        command.add(dbName);
        command.add("-c"); // clean (drop objects before recreating)
        command.add(backupFile.toAbsolutePath().toString());

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.environment().put("PGPASSWORD", dbPassword);
        processBuilder.redirectErrorStream(true);

        logger.info("Starting database restore from: {}", backupFileName);

        Process process = processBuilder.start();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                logger.debug("pg_restore output: {}", line);
            }
        }

        int exitCode = process.waitFor();

        if (exitCode == 0) {
            logger.info("Database restored successfully from: {}", backupFileName);
        } else {
            throw new IOException("Restore failed with exit code: " + exitCode);
        }
    }

    /**
     * Класс для информации о бэкапе
     */
    public static class BackupInfo {
        private String fileName;
        private String filePath;
        private long fileSize;
        private Date createdAt;

        public String getFileName() {
            return fileName;
        }

        public void setFileName(String fileName) {
            this.fileName = fileName;
        }

        public String getFilePath() {
            return filePath;
        }

        public void setFilePath(String filePath) {
            this.filePath = filePath;
        }

        public long getFileSize() {
            return fileSize;
        }

        public void setFileSize(long fileSize) {
            this.fileSize = fileSize;
        }

        public Date getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Date createdAt) {
            this.createdAt = createdAt;
        }
    }
}

