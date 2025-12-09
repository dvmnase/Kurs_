package org.example.bank.controllers;

import org.example.bank.UserDetailsImpl;
import org.example.bank.dto.CreateRouteDTO;
import org.example.bank.dto.RouteDTO;
import org.example.bank.repositories.OwnerRepository;
import org.example.bank.services.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner/routes")
public class OwnerRouteController {

    @Autowired
    private RouteService routeService;

    @Autowired
    private OwnerRepository ownerRepository;

    private Long getOwnerId(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ownerRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Owner not found"))
                .getId();
    }

    @PostMapping
    public ResponseEntity<RouteDTO> createRoute(@RequestBody CreateRouteDTO dto, Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(routeService.createRoute(ownerId, dto));
    }

    @GetMapping
    public ResponseEntity<List<RouteDTO>> getMyRoutes(Authentication authentication) {
        Long ownerId = getOwnerId(authentication);
        return ResponseEntity.ok(routeService.getRoutesByOwner(ownerId));
    }

    @GetMapping("/cargo/{cargoId}")
    public ResponseEntity<List<RouteDTO>> getRoutesByCargo(@PathVariable Long cargoId) {
        return ResponseEntity.ok(routeService.getRoutesByCargo(cargoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RouteDTO> getRoute(@PathVariable Long id) {
        return ResponseEntity.ok(routeService.getRouteById(id));
    }
}

