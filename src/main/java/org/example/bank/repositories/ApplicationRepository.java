package org.example.bank.repositories;

import org.example.bank.entities.Application;
import org.example.bank.models.ApplicationStatus;
import org.example.bank.models.ApplicationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByUserId(Long userId);
    Optional<Application> findByIdAndUserId(Long id, Long userId);
    List<Application> findByAccountIdAndType(Long accountId, ApplicationType type);


    @Query("SELECT NEW map(a.status as status, COUNT(a) as count) FROM Application a GROUP BY a.status")
    List<Map<String, Object>> countByStatusGrouped();
    // Фильтрация заявок по статусу (с пагинацией)
    Page<Application> findByStatus(ApplicationStatus status, Pageable pageable);
}