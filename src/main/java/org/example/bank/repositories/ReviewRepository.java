package org.example.bank.repositories;

import org.example.bank.entities.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByCarrierId(Long carrierId);
    List<Review> findByOwnerId(Long ownerId);
    boolean existsByOwnerIdAndCarrierId(Long ownerId, Long carrierId);
}




