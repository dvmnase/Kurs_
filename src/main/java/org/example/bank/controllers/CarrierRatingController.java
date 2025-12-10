package org.example.bank.controllers;

import org.example.bank.services.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/carrier/rating")
public class CarrierRatingController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/{carrierId}")
    public ResponseEntity<Map<String, Object>> getCarrierRating(@PathVariable Long carrierId) {
        Double averageRating = reviewService.getAverageRatingByCarrier(carrierId);
        return ResponseEntity.ok(Map.of("carrierId", carrierId, "averageRating", averageRating));
    }
}




