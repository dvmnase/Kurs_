package org.example.bank.repositories;

import org.example.bank.entities.Request;
import org.example.bank.models.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {
    List<Request> findByOwnerId(Long ownerId);
    List<Request> findByCarrierId(Long carrierId);
    List<Request> findByStatus(RequestStatus status);
    List<Request> findByCargoId(Long cargoId);
    
    @Query("SELECT r FROM Request r WHERE r.status = :status AND r.carrier IS NULL")
    List<Request> findAvailableRequests(@Param("status") RequestStatus status);
}

