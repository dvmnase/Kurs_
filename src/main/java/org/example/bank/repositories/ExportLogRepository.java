package org.example.bank.repositories;

import org.example.bank.entities.ExportLog;
import org.example.bank.models.ExportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExportLogRepository extends JpaRepository<ExportLog, Long> {
    List<ExportLog> findByUserId(Long userId);
    List<ExportLog> findByType(ExportType type);
}




