package org.example.bank.controllers;

import org.example.bank.UserDetailsImpl;
import org.example.bank.dto.CreateTenderBidDTO;
import org.example.bank.dto.TenderBidDTO;
import org.example.bank.dto.TenderDTO;
import org.example.bank.repositories.CarrierRepository;
import org.example.bank.services.TenderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carrier/tenders")
public class CarrierTenderController {

    @Autowired
    private TenderService tenderService;

    @Autowired
    private CarrierRepository carrierRepository;

    private Long getCarrierId(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return carrierRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Перевозчик не найден"))
                .getId();
    }

    @GetMapping
    public ResponseEntity<List<TenderDTO>> getOpenTenders() {
        return ResponseEntity.ok(tenderService.getOpenTenders());
    }

    @GetMapping("/my-bids")
    public ResponseEntity<List<TenderBidDTO>> getMyBids(Authentication authentication) {
        Long carrierId = getCarrierId(authentication);
        return ResponseEntity.ok(tenderService.getMyBids(carrierId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TenderDTO> getTender(@PathVariable Long id, Authentication authentication) {
        Long carrierId = getCarrierId(authentication);
        return ResponseEntity.ok(tenderService.getTenderByIdForCarrier(id, carrierId));
    }

    @PostMapping("/{id}/bids")
    public ResponseEntity<TenderBidDTO> submitBid(
            @PathVariable Long id,
            @RequestBody CreateTenderBidDTO dto,
            Authentication authentication) {
        Long carrierId = getCarrierId(authentication);
        return ResponseEntity.ok(tenderService.submitBid(id, carrierId, dto));
    }
}
