package org.example.bank.controllers;

import org.example.bank.UserDetailsImpl;
import org.example.bank.dto.*;
import org.example.bank.repositories.OwnerRepository;
import org.example.bank.services.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner/requests")
public class OwnerRequestController {

    @Autowired
    private RequestService requestService;

    @Autowired
    private OwnerRepository ownerRepository;

    private Long getOwnerId(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ownerRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Owner not found"))
                .getId();
    }

    @PostMapping
    public ResponseEntity<RequestDTO> createRequest(@RequestBody CreateRequestDTO dto, Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(requestService.createRequest(ownerId, dto));
    }

    @GetMapping
    public ResponseEntity<List<RequestDTO>> getMyRequests(Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(requestService.getRequestsByOwner(ownerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RequestDTO> getRequest(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.getRequestById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RequestDTO> updateRequest(@PathVariable Long id, @RequestBody UpdateRequestDTO dto, Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(requestService.updateRequest(id, ownerId, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long id, Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        requestService.deleteRequest(id, ownerId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/route")
    public ResponseEntity<RouteDTO> getConfirmedRoute(@PathVariable Long id, Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        // Проверяем, что заявка принадлежит владельцу
        RequestDTO request = requestService.getRequestById(id);
        if (!request.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }
        return ResponseEntity.ok(requestService.getConfirmedRouteByRequestId(id));
    }
}




