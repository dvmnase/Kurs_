package org.example.bank.services;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class GeocodingService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org";

    public Map<String, Object> geocodeAddress(String address) {
        try {
            String url = NOMINATIM_URL + "/search?format=json&q=" + 
                    java.net.URLEncoder.encode(address, "UTF-8") + "&limit=1";
            
            Object[] response = restTemplate.getForObject(url, Object[].class);
            
            if (response != null && response.length > 0) {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = (Map<String, Object>) response[0];
                
                Map<String, Object> coords = new HashMap<>();
                coords.put("latitude", Double.parseDouble(result.get("lat").toString()));
                coords.put("longitude", Double.parseDouble(result.get("lon").toString()));
                coords.put("address", result.get("display_name"));
                
                return coords;
            }
        } catch (Exception e) {
            System.err.println("Geocoding error: " + e.getMessage());
        }
        return null;
    }

    public String reverseGeocode(BigDecimal latitude, BigDecimal longitude) {
        try {
            String url = NOMINATIM_URL + "/reverse?format=json&lat=" + 
                    latitude + "&lon=" + longitude + "&zoom=18&addressdetails=1";
            
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && response.containsKey("display_name")) {
                return response.get("display_name").toString();
            }
        } catch (Exception e) {
            System.err.println("Reverse geocoding error: " + e.getMessage());
        }
        return null;
    }
}


