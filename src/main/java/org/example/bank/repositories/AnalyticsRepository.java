package org.example.bank.repositories;

import org.example.bank.entities.Analytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnalyticsRepository extends JpaRepository<Analytics, Long> {
    Optional<Analytics> findByMetric(String metric);
    List<Analytics> findAllByOrderByCalculatedAtDesc();
}


