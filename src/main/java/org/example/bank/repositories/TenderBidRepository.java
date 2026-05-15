package org.example.bank.repositories;

import org.example.bank.entities.TenderBid;
import org.example.bank.models.BidStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenderBidRepository extends JpaRepository<TenderBid, Long> {
    List<TenderBid> findByTenderIdOrderByCreatedAtAsc(Long tenderId);

    List<TenderBid> findByCarrierIdOrderByCreatedAtDesc(Long carrierId);

    Optional<TenderBid> findByTenderIdAndCarrierId(Long tenderId, Long carrierId);

    long countByTenderIdAndStatus(Long tenderId, BidStatus status);
}
