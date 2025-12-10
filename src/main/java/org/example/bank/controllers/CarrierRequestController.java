package org.example.bank.controllers;

import org.example.bank.UserDetailsImpl;
import org.example.bank.dto.RequestDTO;
import org.example.bank.repositories.CarrierRepository;
import org.example.bank.services.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carrier/requests")
public class CarrierRequestController {

    @Autowired
    private RequestService requestService;

    @Autowired
    private CarrierRepository carrierRepository;

    private Long getCarrierId(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return carrierRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Carrier not found"))
                .getId();
    }

    @GetMapping
    public ResponseEntity<List<RequestDTO>> getMyRequests(Authentication authentication) {
        Long carrierId = getCarrierId(authentication);
        return ResponseEntity.ok(requestService.getRequestsByCarrier(carrierId));
    }

    @GetMapping("/available")
    public ResponseEntity<List<RequestDTO>> getAvailableRequests() {
        return ResponseEntity.ok(requestService.getAvailableRequests());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RequestDTO> getRequest(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.getRequestById(id));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<RequestDTO> acceptRequest(@PathVariable Long id, Authentication authentication) {
        Long carrierId = getCarrierId(authentication);
        return ResponseEntity.ok(requestService.acceptRequest(id, carrierId));
    }

    @PostMapping("/{id}/decline")
    public ResponseEntity<RequestDTO> declineRequest(@PathVariable Long id, Authentication authentication) {
        Long carrierId = getCarrierId(authentication);
        return ResponseEntity.ok(requestService.declineRequest(id, carrierId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<RequestDTO> updateRequestStatus(
            @PathVariable Long id,
            @RequestBody org.example.bank.dto.UpdateRequestStatusDTO dto,
            Authentication authentication) {
        Long carrierId = getCarrierId(authentication);
        return ResponseEntity.ok(requestService.updateRequestStatus(id, carrierId, dto.getStatus()));
    }
}

