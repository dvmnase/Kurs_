package org.example.bank.services;

import org.example.bank.dto.CreateRouteDTO;
import org.example.bank.dto.RouteDTO;
import org.example.bank.entities.Cargo;
import org.example.bank.entities.Route;
import org.example.bank.repositories.CargoRepository;
import org.example.bank.repositories.RouteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RouteService {

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Transactional
    public RouteDTO createRoute(Long ownerId, CreateRouteDTO dto) {
        Cargo cargo = cargoRepository.findById(dto.getCargoId())
                .orElseThrow(() -> new RuntimeException("Cargo not found"));

        if (!cargo.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        Route route = new Route();
        route.setCargo(cargo);
        route.setStartAddress(dto.getStartAddress());
        route.setEndAddress(dto.getEndAddress());
        route.setStartLat(dto.getStartLat());
        route.setStartLng(dto.getStartLng());
        route.setEndLat(dto.getEndLat());
        route.setEndLng(dto.getEndLng());

        route = routeRepository.save(route);
        return convertToDTO(route);
    }

    public List<RouteDTO> getRoutesByCargo(Long cargoId) {
        return routeRepository.findByCargoId(cargoId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<RouteDTO> getRoutesByOwner(Long ownerId) {
        return routeRepository.findByOwnerId(ownerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public RouteDTO getRouteById(Long id) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Route not found"));
        return convertToDTO(route);
    }

    private RouteDTO convertToDTO(Route route) {
        RouteDTO dto = new RouteDTO();
        dto.setId(route.getId());
        dto.setCargoId(route.getCargo().getId());
        dto.setStartAddress(route.getStartAddress());
        dto.setEndAddress(route.getEndAddress());
        dto.setStartLat(route.getStartLat());
        dto.setStartLng(route.getStartLng());
        dto.setEndLat(route.getEndLat());
        dto.setEndLng(route.getEndLng());
        dto.setCreatedAt(route.getCreatedAt());
        return dto;
    }
}

