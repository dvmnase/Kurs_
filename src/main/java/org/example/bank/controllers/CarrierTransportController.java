package org.example.bank.controllers;

import org.example.bank.UserDetailsImpl;
import org.example.bank.dto.TransportDTO;
import org.example.bank.repositories.CarrierRepository;
import org.example.bank.services.ExcelExportService;
import org.example.bank.services.ExportService;
import org.example.bank.services.TransportService;
import org.example.bank.models.ExportType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carrier/transports")
public class CarrierTransportController {

    @Autowired
    private TransportService transportService;

    @Autowired
    private CarrierRepository carrierRepository;

    @Autowired
    private ExportService exportService;

    @Autowired
    private ExcelExportService excelExportService;

    private Long getCarrierId(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return carrierRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Carrier not found"))
                .getId();
    }

    @PostMapping
    public ResponseEntity<TransportDTO> createTransport(@RequestBody TransportDTO dto, Authentication authentication) {
        Long carrierId = getCarrierId(authentication);
        return ResponseEntity.ok(transportService.createTransport(carrierId, dto));
    }

    @GetMapping
    public ResponseEntity<List<TransportDTO>> getMyTransports(Authentication authentication) {
        Long carrierId = getCarrierId(authentication);
        return ResponseEntity.ok(transportService.getTransportsByCarrier(carrierId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransportDTO> getTransport(@PathVariable Long id) {
        return ResponseEntity.ok(transportService.getTransportById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransportDTO> updateTransport(@PathVariable Long id, @RequestBody TransportDTO dto, Authentication authentication) {
        Long carrierId = getCarrierId(authentication);
        return ResponseEntity.ok(transportService.updateTransport(id, carrierId, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransport(@PathVariable Long id, Authentication authentication) {
        Long carrierId = getCarrierId(authentication);
        transportService.deleteTransport(id, carrierId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportTransports(Authentication authentication) {
        try {
            Long carrierId = getCarrierId(authentication);
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            exportService.logExport(userDetails.getId(), ExportType.TRANSPORT);
            
            byte[] excelData = excelExportService.exportTransportsToExcel(carrierId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "transports.xlsx");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

