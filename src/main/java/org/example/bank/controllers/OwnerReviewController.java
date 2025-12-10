package org.example.bank.controllers;

import org.example.bank.UserDetailsImpl;
import org.example.bank.dto.CreateReviewDTO;
import org.example.bank.dto.ReviewDTO;
import org.example.bank.repositories.OwnerRepository;
import org.example.bank.services.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner/reviews")
public class OwnerReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private OwnerRepository ownerRepository;

    private Long getOwnerId(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ownerRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Owner not found"))
                .getId();
    }

    @PostMapping
    public ResponseEntity<ReviewDTO> createReview(@RequestBody CreateReviewDTO dto, Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(reviewService.createReview(ownerId, dto));
    }

    @GetMapping("/carrier/{carrierId}")
    public ResponseEntity<List<ReviewDTO>> getCarrierReviews(@PathVariable Long carrierId, Authentication authentication) {
        // Владелец может просматривать отзывы любого перевозчика
        return ResponseEntity.ok(reviewService.getReviewsByCarrier(carrierId));
    }
}




