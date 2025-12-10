package org.example.bank.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class GeocodingService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org";
    
    @Value("${yandex.maps.api.key:}")
    private String yandexApiKey;

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "CargoManagementSystem/1.0");
        return headers;
    }

    public Map<String, Object> geocodeAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            return null;
        }
        
        // Сначала пробуем Yandex Geocoding API (используем Яндекс Карты)
        Map<String, Object> yandexResult = geocodeWithYandex(address);
        if (yandexResult != null) {
            return yandexResult;
        }
        
        // Если Yandex не нашел, пробуем Nominatim с оптимизированными вариантами адреса
        // Используем только самые эффективные варианты для быстрого поиска
        String[] searchVariants = {
            address,  // Оригинальный адрес
            address.replaceAll(",\\s*", " ").trim(),  // Убираем запятые
            normalizeAddressForYandex(address),  // Нормализованный адрес
            simplifyAddress(address)  // Упрощенный вариант
        };
        
        for (int i = 0; i < searchVariants.length; i++) {
            String searchQuery = searchVariants[i];
            if (searchQuery == null || searchQuery.trim().isEmpty()) {
                continue;
            }
            
            try {
                // Добавляем небольшую задержку только для второго и последующих запросов
                if (i > 0) {
                    Thread.sleep(300);  // Уменьшаем задержку до 300мс для быстрого отклика
                }
                
                String encodedAddress = java.net.URLEncoder.encode(searchQuery, "UTF-8");
                // Добавляем countrycodes=by для поиска только в Беларуси
                String url = NOMINATIM_URL + "/search?format=json&q=" + encodedAddress + 
                        "&limit=5&addressdetails=1&countrycodes=by&accept-language=be,ru,en";
                
                HttpEntity<String> entity = new HttpEntity<>(createHeaders());
                ResponseEntity<Object[]> response = restTemplate.exchange(url, HttpMethod.GET, entity, Object[].class);
                
                if (response.getBody() != null && response.getBody().length > 0) {
                    // Ищем результат в Беларуси
                    for (Object obj : response.getBody()) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> result = (Map<String, Object>) obj;
                        
                        @SuppressWarnings("unchecked")
                        Map<String, Object> addressDetails = (Map<String, Object>) result.get("address");
                        if (addressDetails != null) {
                            String countryCode = (String) addressDetails.get("country_code");
                            // Если это Беларусь или страна не указана, используем результат
                            if (countryCode == null || "by".equalsIgnoreCase(countryCode)) {
                                Map<String, Object> coords = new HashMap<>();
                                coords.put("latitude", Double.parseDouble(result.get("lat").toString()));
                                coords.put("longitude", Double.parseDouble(result.get("lon").toString()));
                                coords.put("address", result.get("display_name"));
                                
                                return coords;
                            }
                        }
                    }
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.err.println("Geocoding interrupted: " + e.getMessage());
                break;
            } catch (Exception e) {
                System.err.println("Geocoding error for query '" + searchQuery + "': " + e.getMessage());
                // Продолжаем пробовать следующий вариант
                continue;
            }
        }
        
        System.err.println("Geocoding: No results found for address: " + address);
        return null;
    }
    
    private Map<String, Object> geocodeWithYandex(String address) {
        try {
            // Нормализуем адрес для лучшего поиска
            String normalizedAddress = normalizeAddressForYandex(address);
            
            // Пробуем несколько вариантов адреса
            String[] addressVariants = {
                normalizedAddress,
                address,
                address.replaceAll(",\\s*", " ").trim(),
                address.replaceAll("ул\\.", "улица").replaceAll(",\\s*", " ").trim(),
                address.replaceAll("улица", "ул").replaceAll(",\\s*", " ").trim()
            };
            
            for (String addr : addressVariants) {
                if (addr == null || addr.trim().isEmpty()) {
                    continue;
                }
                
                try {
                    String encodedAddress = java.net.URLEncoder.encode(addr, "UTF-8");
                    // Добавляем country=BY для поиска в Беларуси
                    String url = "https://geocode-maps.yandex.ru/1.x/?format=json&geocode=" + encodedAddress + "&results=5&kind=house";
                    
                    if (yandexApiKey != null && !yandexApiKey.isEmpty()) {
                        url += "&apikey=" + yandexApiKey;
                    }
                    
                    System.out.println("Yandex Geocoding request URL: " + url);
            
                    HttpEntity<String> entity = new HttpEntity<>(createHeaders());
                    ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
                    
                    if (response.getBody() != null) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> body = response.getBody();
                        
                        @SuppressWarnings("unchecked")
                        Map<String, Object> responseMap = (Map<String, Object>) body.get("response");
                        if (responseMap != null) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> geoObjectCollection = (Map<String, Object>) responseMap.get("GeoObjectCollection");
                            if (geoObjectCollection != null) {
                                Object featureMemberObj = geoObjectCollection.get("featureMember");
                                if (featureMemberObj != null) {
                                    java.util.List<Map<String, Object>> featureMembers;
                                    if (featureMemberObj instanceof java.util.List) {
                                        featureMembers = (java.util.List<Map<String, Object>>) featureMemberObj;
                                    } else {
                                        featureMembers = new java.util.ArrayList<>();
                                        featureMembers.add((Map<String, Object>) featureMemberObj);
                                    }
                                    
                                    if (!featureMembers.isEmpty()) {
                                        // Берем первый результат, который находится в Беларуси
                                        for (Map<String, Object> featureMember : featureMembers) {
                                            @SuppressWarnings("unchecked")
                                            Map<String, Object> geoObject = (Map<String, Object>) featureMember.get("GeoObject");
                                            
                                            if (geoObject != null) {
                                                // Проверяем, что это адрес в Беларуси
                                                @SuppressWarnings("unchecked")
                                                Map<String, Object> metaDataProperty = (Map<String, Object>) geoObject.get("metaDataProperty");
                                                if (metaDataProperty != null) {
                                                    @SuppressWarnings("unchecked")
                                                    Map<String, Object> metaData = (Map<String, Object>) metaDataProperty.get("GeocoderMetaData");
                                                    if (metaData != null) {
                                                        @SuppressWarnings("unchecked")
                                                        Map<String, Object> addressInfo = (Map<String, Object>) metaData.get("Address");
                                                        if (addressInfo != null) {
                                                            String countryCode = (String) addressInfo.get("country_code");
                                                            // Если страна не указана или это Беларусь, используем результат
                                                            if (countryCode == null || "BY".equalsIgnoreCase(countryCode)) {
                                                                @SuppressWarnings("unchecked")
                                                                Map<String, Object> point = (Map<String, Object>) geoObject.get("Point");
                                                                String pointStr = (String) point.get("pos");
                                                                String[] coords = pointStr.split(" ");
                                                                
                                                                Map<String, Object> coordsMap = new HashMap<>();
                                                                coordsMap.put("latitude", Double.parseDouble(coords[1]));
                                                                coordsMap.put("longitude", Double.parseDouble(coords[0]));
                                                                
                                                                String formattedAddress = (String) addressInfo.get("formatted");
                                                                coordsMap.put("address", formattedAddress != null ? formattedAddress : address);
                                                                
                                                                System.out.println("Yandex Geocoding result: " + coordsMap);
                                                                return coordsMap;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    // Продолжаем пробовать следующий вариант
                    System.err.println("Yandex Geocoding error for variant '" + addr + "': " + e.getMessage());
                    continue;
                }
            }
        } catch (Exception e) {
            System.err.println("Yandex Geocoding error: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }
    
    private String normalizeAddressForYandex(String address) {
        if (address == null) {
            return null;
        }
        
        // Нормализуем адрес для Yandex
        String normalized = address
            .replaceAll(",\\s*", ", ")  // Нормализуем запятые
            .replaceAll("\\s+", " ")    // Нормализуем пробелы
            .trim();
        
        // Если адрес не содержит "Минск" или "Беларусь", добавляем "Минск, " в начало
        if (!normalized.toLowerCase().contains("минск") && 
            !normalized.toLowerCase().contains("беларусь") &&
            !normalized.toLowerCase().contains("belarus")) {
            // Проверяем, не начинается ли адрес с города
            if (!normalized.matches("^[А-Яа-яA-Za-z]+,\\s*.*")) {
                normalized = "Минск, " + normalized;
            }
        }
        
        return normalized;
    }
    
    private String simplifyAddress(String address) {
        if (address == null) {
            return null;
        }
        
        // Упрощаем адрес: убираем лишние части, оставляем только ключевые слова
        String simplified = address
            .replaceAll("\\d+", "")  // Убираем числа
            .replaceAll("[,;]", " ")  // Заменяем запятые и точки с запятой на пробелы
            .replaceAll("\\s+", " ")  // Нормализуем пробелы
            .trim();
        
        // Если адрес слишком короткий после упрощения, возвращаем оригинал
        if (simplified.length() < 3) {
            return address;
        }
        
        return simplified;
    }

    public String reverseGeocode(BigDecimal latitude, BigDecimal longitude) {
        try {
            // Сначала пробуем Yandex Reverse Geocoding API (быстрее)
            String yandexAddress = reverseGeocodeWithYandex(latitude, longitude);
            if (yandexAddress != null) {
                return yandexAddress;
            }
            
            // Если Yandex не нашел, пробуем Nominatim
            String url = NOMINATIM_URL + "/reverse?format=json&lat=" + 
                    latitude + "&lon=" + longitude + "&zoom=18&addressdetails=1";
            
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            
            if (response.getBody() != null && response.getBody().containsKey("display_name")) {
                return response.getBody().get("display_name").toString();
            }
        } catch (Exception e) {
            System.err.println("Reverse geocoding error: " + e.getMessage());
        }
        return null;
    }
    
    private String reverseGeocodeWithYandex(BigDecimal latitude, BigDecimal longitude) {
        try {
            String url = "https://geocode-maps.yandex.ru/1.x/?format=json&geocode=" + 
                    longitude + "," + latitude + "&results=1";
            
            if (yandexApiKey != null && !yandexApiKey.isEmpty()) {
                url += "&apikey=" + yandexApiKey;
            }
            
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            
            if (response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> body = response.getBody();
                
                @SuppressWarnings("unchecked")
                Map<String, Object> responseMap = (Map<String, Object>) body.get("response");
                if (responseMap != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> geoObjectCollection = (Map<String, Object>) responseMap.get("GeoObjectCollection");
                    if (geoObjectCollection != null) {
                        Object featureMemberObj = geoObjectCollection.get("featureMember");
                        if (featureMemberObj != null) {
                            java.util.List<Map<String, Object>> featureMembers;
                            if (featureMemberObj instanceof java.util.List) {
                                featureMembers = (java.util.List<Map<String, Object>>) featureMemberObj;
                            } else {
                                featureMembers = new java.util.ArrayList<>();
                                featureMembers.add((Map<String, Object>) featureMemberObj);
                            }
                            
                            if (!featureMembers.isEmpty()) {
                                Map<String, Object> featureMember = featureMembers.get(0);
                                @SuppressWarnings("unchecked")
                                Map<String, Object> geoObject = (Map<String, Object>) featureMember.get("GeoObject");
                                if (geoObject != null) {
                                    @SuppressWarnings("unchecked")
                                    Map<String, Object> metaDataProperty = (Map<String, Object>) geoObject.get("metaDataProperty");
                                    if (metaDataProperty != null) {
                                        @SuppressWarnings("unchecked")
                                        Map<String, Object> metaData = (Map<String, Object>) metaDataProperty.get("GeocoderMetaData");
                                        if (metaData != null) {
                                            @SuppressWarnings("unchecked")
                                            Map<String, Object> addressInfo = (Map<String, Object>) metaData.get("Address");
                                            if (addressInfo != null) {
                                                String formattedAddress = (String) addressInfo.get("formatted");
                                                if (formattedAddress != null) {
                                                    return formattedAddress;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Yandex Reverse Geocoding error: " + e.getMessage());
        }
        return null;
    }
}




