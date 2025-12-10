package org.example.bank.repositories;

import org.example.bank.entities.CargoLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CargoLocationRepository extends JpaRepository<CargoLocation, Long> {
    List<CargoLocation> findByCargoId(Long cargoId);
    Optional<CargoLocation> findFirstByCargoIdOrderByUpdatedAtDesc(Long cargoId);
}




