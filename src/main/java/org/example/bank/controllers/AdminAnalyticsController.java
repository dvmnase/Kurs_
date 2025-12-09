package org.example.bank.controllers;

import org.example.bank.dto.AnalyticsDTO;
import org.example.bank.services.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping
    public ResponseEntity<List<AnalyticsDTO>> getAllAnalytics() {
        return ResponseEntity.ok(analyticsService.getAllAnalytics());
    }

    @GetMapping("/metric/{metric}")
    public ResponseEntity<AnalyticsDTO> getMetric(@PathVariable String metric) {
        AnalyticsDTO dto = analyticsService.getMetric(metric);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/calculate")
    public ResponseEntity<Void> calculateAnalytics() {
        analyticsService.calculateAnalytics();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> getStatisticsReport() {
        return ResponseEntity.ok(analyticsService.getStatisticsReport());
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportStatistics() {
        try {
            byte[] excelData = analyticsService.exportStatisticsToExcel();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "statistics.xlsx");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

