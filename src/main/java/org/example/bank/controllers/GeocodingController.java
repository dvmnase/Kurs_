package org.example.bank.controllers;

import org.example.bank.services.GeocodingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/geocoding")
public class GeocodingController {

    @Autowired
    private GeocodingService geocodingService;

    @GetMapping("/geocode")
    public ResponseEntity<Map<String, Object>> geocodeAddress(@RequestParam String address) {
        Map<String, Object> result = geocodingService.geocodeAddress(address);
        if (result != null) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/reverse")
    public ResponseEntity<Map<String, String>> reverseGeocode(
            @RequestParam BigDecimal latitude,
            @RequestParam BigDecimal longitude) {
        String address = geocodingService.reverseGeocode(latitude, longitude);
        if (address != null) {
            return ResponseEntity.ok(Map.of("address", address));
        }
        return ResponseEntity.notFound().build();
    }
}


