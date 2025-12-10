package org.example.bank.services;

import org.example.bank.dto.AnalyticsDTO;
import org.example.bank.entities.Analytics;
import org.example.bank.models.RequestStatus;
import org.example.bank.repositories.AnalyticsRepository;
import org.example.bank.repositories.RequestRepository;
import org.example.bank.repositories.RouteRepository;
import org.example.bank.repositories.CargoRepository;
import org.example.bank.services.ExcelExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private AnalyticsRepository analyticsRepository;

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private ExcelExportService excelExportService;

    @Transactional
    public void calculateAnalytics() {
        // Количество заявок
        long totalRequests = requestRepository.count();
        saveMetric("total_requests", BigDecimal.valueOf(totalRequests));

        // Количество заявок по статусам
        for (RequestStatus status : RequestStatus.values()) {
            long count = requestRepository.findByStatus(status).size();
            saveMetric("requests_" + status.name().toLowerCase(), BigDecimal.valueOf(count));
        }

        // Количество грузов
        long totalCargos = cargoRepository.count();
        saveMetric("total_cargos", BigDecimal.valueOf(totalCargos));
    }

    private void saveMetric(String metric, BigDecimal value) {
        Analytics analytics = analyticsRepository.findByMetric(metric)
                .orElse(new Analytics());
        analytics.setMetric(metric);
        analytics.setValue(value);
        analytics.setCalculatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
        analyticsRepository.save(analytics);
    }

    public List<AnalyticsDTO> getAllAnalytics() {
        return analyticsRepository.findAllByOrderByCalculatedAtDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AnalyticsDTO getMetric(String metric) {
        return analyticsRepository.findByMetric(metric)
                .map(this::convertToDTO)
                .orElse(null);
    }

    private AnalyticsDTO convertToDTO(Analytics analytics) {
        AnalyticsDTO dto = new AnalyticsDTO();
        dto.setId(analytics.getId());
        dto.setMetric(analytics.getMetric());
        dto.setValue(analytics.getValue());
        dto.setCalculatedAt(analytics.getCalculatedAt());
        return dto;
    }

    public Map<String, Object> getStatisticsReport() {
        Map<String, Object> report = new HashMap<>();
        
        long totalRequests = requestRepository.count();
        long totalCargos = cargoRepository.count();
        
        Map<String, Long> requestsByStatus = new HashMap<>();
        for (RequestStatus status : RequestStatus.values()) {
            long count = requestRepository.findByStatus(status).size();
            requestsByStatus.put(status.name(), count);
        }
        
        report.put("totalRequests", totalRequests);
        report.put("totalCargos", totalCargos);
        report.put("requestsByStatus", requestsByStatus);
        
        return report;
    }

    public byte[] exportStatisticsToExcel() throws IOException {
        Map<String, Object> stats = getStatisticsReport();
        
        org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
        org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Статистика");
        
        // Header
        org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Метрика");
        headerRow.createCell(1).setCellValue("Значение");
        
        int rowNum = 1;
        org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowNum++);
        row.createCell(0).setCellValue("Всего заявок");
        row.createCell(1).setCellValue((Long) stats.get("totalRequests"));
        
        row = sheet.createRow(rowNum++);
        row.createCell(0).setCellValue("Всего грузов");
        row.createCell(1).setCellValue((Long) stats.get("totalCargos"));
        
        @SuppressWarnings("unchecked")
        Map<String, Long> requestsByStatus = (Map<String, Long>) stats.get("requestsByStatus");
        for (Map.Entry<String, Long> entry : requestsByStatus.entrySet()) {
            row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue("Заявки: " + entry.getKey());
            row.createCell(1).setCellValue(entry.getValue());
        }
        
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
        
        java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        
        return outputStream.toByteArray();
    }
}

