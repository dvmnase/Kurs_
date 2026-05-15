package org.example.bank.repositories;

import org.example.bank.entities.Tender;
import org.example.bank.models.TenderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenderRepository extends JpaRepository<Tender, Long> {
    List<Tender> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    List<Tender> findByStatusOrderByCreatedAtDesc(TenderStatus status);

    Optional<Tender> findByCargoIdAndStatus(Long cargoId, TenderStatus status);

    boolean existsByCargoIdAndStatus(Long cargoId, TenderStatus status);
}
