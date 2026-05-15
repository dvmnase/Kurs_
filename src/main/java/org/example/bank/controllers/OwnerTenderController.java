package org.example.bank.controllers;

import org.example.bank.UserDetailsImpl;
import org.example.bank.dto.CreateTenderDTO;
import org.example.bank.dto.TenderDTO;
import org.example.bank.repositories.OwnerRepository;
import org.example.bank.services.TenderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner/tenders")
public class OwnerTenderController {

    @Autowired
    private TenderService tenderService;

    @Autowired
    private OwnerRepository ownerRepository;

    private Long getOwnerId(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ownerRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Владелец не найден"))
                .getId();
    }

    @PostMapping
    public ResponseEntity<TenderDTO> createTender(@RequestBody CreateTenderDTO dto, Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(tenderService.createTender(ownerId, dto));
    }

    @GetMapping
    public ResponseEntity<List<TenderDTO>> getMyTenders(Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(tenderService.getTendersByOwner(ownerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TenderDTO> getTender(@PathVariable Long id, Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(tenderService.getTenderByIdForOwner(id, ownerId));
    }

    @PostMapping("/{tenderId}/bids/{bidId}/accept")
    public ResponseEntity<TenderDTO> acceptBid(
            @PathVariable Long tenderId,
            @PathVariable Long bidId,
            Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(tenderService.acceptBid(tenderId, bidId, ownerId));
    }
}
