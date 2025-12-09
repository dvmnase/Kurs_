package org.example.bank.services;

import org.example.bank.dto.CreateReviewDTO;
import org.example.bank.dto.ReviewDTO;
import org.example.bank.entities.Carrier;
import org.example.bank.entities.Owner;
import org.example.bank.entities.Review;
import org.example.bank.repositories.CarrierRepository;
import org.example.bank.repositories.OwnerRepository;
import org.example.bank.repositories.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private OwnerRepository ownerRepository;

    @Autowired
    private CarrierRepository carrierRepository;

    @Transactional
    public ReviewDTO createReview(Long ownerId, CreateReviewDTO dto) {
        Owner owner = ownerRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        Carrier carrier = carrierRepository.findById(dto.getCarrierId())
                .orElseThrow(() -> new RuntimeException("Carrier not found"));

        Review review = new Review();
        review.setOwner(owner);
        review.setCarrier(carrier);
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());

        review = reviewRepository.save(review);
        return convertToDTO(review);
    }

    public List<ReviewDTO> getReviewsByCarrier(Long carrierId) {
        return reviewRepository.findByCarrierId(carrierId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Double getAverageRatingByCarrier(Long carrierId) {
        List<Review> reviews = reviewRepository.findByCarrierId(carrierId);
        if (reviews.isEmpty()) {
            return 0.0;
        }
        double sum = reviews.stream()
                .mapToInt(Review::getRating)
                .sum();
        return sum / reviews.size();
    }

    private ReviewDTO convertToDTO(Review review) {
        ReviewDTO dto = new ReviewDTO();
        dto.setId(review.getId());
        dto.setOwnerId(review.getOwner().getId());
        dto.setOwnerName(review.getOwner().getFullName());
        dto.setCarrierId(review.getCarrier().getId());
        dto.setCarrierName(review.getCarrier().getCompanyName());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        return dto;
    }
}

