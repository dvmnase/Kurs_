package org.example.bank.services;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.example.bank.dto.CargoDTO;
import org.example.bank.dto.TransportDTO;
import org.example.bank.entities.Cargo;
import org.example.bank.entities.Transport;
import org.example.bank.repositories.CargoRepository;
import org.example.bank.repositories.TransportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ExcelExportService {

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private TransportRepository transportRepository;

    public byte[] exportCargosToExcel(Long ownerId) throws IOException {
        List<Cargo> cargos = cargoRepository.findByOwnerId(ownerId);
        
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Грузы");
        
        // Header
        Row headerRow = sheet.createRow(0);
        String[] headers = {"ID", "Название", "Описание", "Вес", "Дата создания"};
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        
        // Data
        int rowNum = 1;
        for (Cargo cargo : cargos) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(cargo.getId());
            row.createCell(1).setCellValue(cargo.getName());
            row.createCell(2).setCellValue(cargo.getDescription() != null ? cargo.getDescription() : "");
            row.createCell(3).setCellValue(cargo.getWeight() != null ? cargo.getWeight().doubleValue() : 0);
            row.createCell(4).setCellValue(cargo.getCreatedAt() != null ? cargo.getCreatedAt().toString() : "");
        }
        
        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        
        return outputStream.toByteArray();
    }

    public byte[] exportTransportsToExcel(Long carrierId) throws IOException {
        List<Transport> transports = transportRepository.findByCarrierId(carrierId);
        
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Транспорт");
        
        // Header
        Row headerRow = sheet.createRow(0);
        String[] headers = {"ID", "Тип", "Номер", "Грузоподъемность"};
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        
        // Data
        int rowNum = 1;
        for (Transport transport : transports) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(transport.getId());
            row.createCell(1).setCellValue(transport.getType() != null ? transport.getType() : "");
            row.createCell(2).setCellValue(transport.getNumberPlate() != null ? transport.getNumberPlate() : "");
            row.createCell(3).setCellValue(transport.getCapacity() != null ? transport.getCapacity().doubleValue() : 0);
        }
        
        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        
        return outputStream.toByteArray();
    }
}




