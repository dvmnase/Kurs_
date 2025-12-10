package org.example.bank.repositories;

import org.example.bank.entities.Carrier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CarrierRepository extends JpaRepository<Carrier, Long> {
    Optional<Carrier> findByUserId(Long userId);
}




