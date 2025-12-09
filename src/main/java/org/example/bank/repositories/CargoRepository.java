package org.example.bank.repositories;

import org.example.bank.entities.Cargo;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface CargoRepository extends JpaRepository<Cargo, Long> {
    List<Cargo> findByOwnerId(Long ownerId);
    
    @Query("SELECT c FROM Cargo c WHERE c.name LIKE %:searchTerm% OR c.description LIKE %:searchTerm%")
    List<Cargo> searchByNameOrDescription(@Param("searchTerm") String searchTerm);
    
    List<Cargo> findByOwnerId(Long ownerId, Sort sort);
    
    @Query("SELECT c FROM Cargo c WHERE c.owner.id = :ownerId AND (:minWeight IS NULL OR c.weight >= :minWeight) AND (:maxWeight IS NULL OR c.weight <= :maxWeight)")
    List<Cargo> findByOwnerIdWithWeightFilter(@Param("ownerId") Long ownerId, 
                                               @Param("minWeight") BigDecimal minWeight, 
                                               @Param("maxWeight") BigDecimal maxWeight,
                                               Sort sort);
}

