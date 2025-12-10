package org.example.bank.controllers;

import org.example.bank.services.GeocodingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/geocoding")
public class GeocodingController {

    @Autowired
    private GeocodingService geocodingService;

    @GetMapping("/geocode")
    public ResponseEntity<?> geocodeAddress(@RequestParam String address) {
        try {
            if (address == null || address.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Address parameter is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            System.out.println("GeocodingController: Received address request: " + address);
            
            Map<String, Object> result = geocodingService.geocodeAddress(address);
            if (result != null) {
                System.out.println("GeocodingController: Found coordinates: " + result);
                return ResponseEntity.ok(result);
            }
            
            System.out.println("GeocodingController: Address not found: " + address);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Address not found. Please try a different address format or enter coordinates manually.");
            error.put("address", address);
            // Возвращаем 200 с ошибкой, чтобы фронтенд мог обработать это корректно
            return ResponseEntity.ok(error);
        } catch (Exception e) {
            System.err.println("Error in geocodeAddress: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/reverse")
    public ResponseEntity<?> reverseGeocode(
            @RequestParam BigDecimal latitude,
            @RequestParam BigDecimal longitude) {
        try {
            if (latitude == null || longitude == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Latitude and longitude parameters are required");
                return ResponseEntity.badRequest().body(error);
            }
            
            String address = geocodingService.reverseGeocode(latitude, longitude);
            if (address != null) {
                return ResponseEntity.ok(Map.of("address", address));
            }
            
            Map<String, String> error = new HashMap<>();
            error.put("error", "Address not found for given coordinates");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            System.err.println("Error in reverseGeocode: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}




