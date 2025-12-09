package org.example.bank.controllers;

import org.example.bank.UserDetailsImpl;
import org.example.bank.dto.*;
import org.example.bank.repositories.OwnerRepository;
import org.example.bank.services.CargoService;
import org.example.bank.services.ExcelExportService;
import org.example.bank.services.ExportService;
import org.example.bank.models.ExportType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/owner/cargo")
public class OwnerCargoController {

    @Autowired
    private CargoService cargoService;

    @Autowired
    private OwnerRepository ownerRepository;

    @Autowired
    private ExportService exportService;

    @Autowired
    private ExcelExportService excelExportService;

    private Long getOwnerId(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ownerRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Owner not found"))
                .getId();
    }

    @PostMapping
    public ResponseEntity<CargoDTO> createCargo(@RequestBody CreateCargoDTO dto, Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(cargoService.createCargo(ownerId, dto));
    }

    @GetMapping
    public ResponseEntity<List<CargoDTO>> getMyCargos(
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder,
            @RequestParam(required = false) BigDecimal minWeight,
            @RequestParam(required = false) BigDecimal maxWeight) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(cargoService.getCargosByOwnerWithFilters(
                ownerId, search, sortBy, sortOrder, minWeight, maxWeight));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CargoDTO> getCargo(@PathVariable Long id) {
        return ResponseEntity.ok(cargoService.getCargoById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<CargoDTO>> searchCargos(@RequestParam String q) {
        return ResponseEntity.ok(cargoService.searchCargos(q));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CargoDTO> updateCargo(@PathVariable Long id, @RequestBody UpdateCargoDTO dto, Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(cargoService.updateCargo(id, ownerId, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCargo(@PathVariable Long id, Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        cargoService.deleteCargo(id, ownerId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCargos(Authentication authentication) {
        try {
            Long ownerId = getOwnerId(authentication);
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            exportService.logExport(userDetails.getId(), ExportType.CARGO);
            
            byte[] excelData = excelExportService.exportCargosToExcel(ownerId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "cargos.xlsx");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

