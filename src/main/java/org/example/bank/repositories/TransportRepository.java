package org.example.bank.repositories;

import org.example.bank.entities.Transport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransportRepository extends JpaRepository<Transport, Long> {
    List<Transport> findByCarrierId(Long carrierId);
}


