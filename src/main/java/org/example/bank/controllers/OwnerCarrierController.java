package org.example.bank.controllers;

import org.example.bank.entities.Carrier;
import org.example.bank.repositories.CarrierRepository;
import org.example.bank.services.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/owner/carriers")
public class OwnerCarrierController {

    @Autowired
    private CarrierRepository carrierRepository;

    @Autowired
    private ReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllCarriers() {
        List<Carrier> carriers = carrierRepository.findAll();
        
        List<Map<String, Object>> carriersList = carriers.stream().map(carrier -> {
            Map<String, Object> carrierMap = new HashMap<>();
            carrierMap.put("id", carrier.getId());
            carrierMap.put("companyName", carrier.getCompanyName() != null ? carrier.getCompanyName() : "");
            carrierMap.put("phone", carrier.getPhone() != null ? carrier.getPhone() : "");
            carrierMap.put("email", carrier.getUser().getEmail() != null ? carrier.getUser().getEmail() : "");
            // Добавляем средний рейтинг
            Double averageRating = reviewService.getAverageRatingByCarrier(carrier.getId());
            carrierMap.put("averageRating", averageRating);
            return carrierMap;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(carriersList);
    }
}

