package org.example.bank.repositories;

import org.example.bank.entities.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByCargoId(Long cargoId);
    
    @Query("SELECT r FROM Route r WHERE r.cargo.owner.id = :ownerId")
    List<Route> findByOwnerId(@Param("ownerId") Long ownerId);
}

