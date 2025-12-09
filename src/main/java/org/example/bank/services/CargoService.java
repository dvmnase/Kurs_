package org.example.bank.services;

import org.example.bank.dto.*;
import org.example.bank.entities.Cargo;
import org.example.bank.entities.CargoLocation;
import org.example.bank.entities.Owner;
import org.example.bank.repositories.CargoLocationRepository;
import org.example.bank.repositories.CargoRepository;
import org.example.bank.repositories.OwnerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CargoService {

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private CargoLocationRepository cargoLocationRepository;

    @Autowired
    private OwnerRepository ownerRepository;

    @Transactional
    public CargoDTO createCargo(Long ownerId, CreateCargoDTO dto) {
        Owner owner = ownerRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        Cargo cargo = new Cargo();
        cargo.setOwner(owner);
        cargo.setName(dto.getName());
        cargo.setDescription(dto.getDescription());
        cargo.setWeight(dto.getWeight());
        cargo = cargoRepository.save(cargo);

        if (dto.getLatitude() != null && dto.getLongitude() != null) {
            CargoLocation location = new CargoLocation();
            location.setCargo(cargo);
            location.setLatitude(dto.getLatitude());
            location.setLongitude(dto.getLongitude());
            location.setAddress(dto.getAddress());
            cargoLocationRepository.save(location);
        }

        return convertToDTO(cargo);
    }

    public List<CargoDTO> getCargosByOwner(Long ownerId) {
        return cargoRepository.findByOwnerId(ownerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CargoDTO getCargoById(Long id) {
        Cargo cargo = cargoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cargo not found"));
        return convertToDTO(cargo);
    }

    public List<CargoDTO> searchCargos(String searchTerm) {
        return cargoRepository.searchByNameOrDescription(searchTerm).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CargoDTO> getAllCargos() {
        return cargoRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CargoDTO> getCargosByOwnerWithFilters(Long ownerId, String search, String sortBy, String sortOrder, 
                                                       BigDecimal minWeight, BigDecimal maxWeight) {
        Sort sort = createSort(sortBy, sortOrder);
        
        List<Cargo> cargos;
        if (search != null && !search.isEmpty()) {
            cargos = cargoRepository.searchByNameOrDescription(search);
            cargos = cargos.stream()
                    .filter(c -> c.getOwner().getId().equals(ownerId))
                    .collect(Collectors.toList());
        } else if (minWeight != null || maxWeight != null) {
            cargos = cargoRepository.findByOwnerIdWithWeightFilter(ownerId, minWeight, maxWeight, sort);
        } else {
            cargos = cargoRepository.findByOwnerId(ownerId, sort);
        }
        
        return cargos.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private Sort createSort(String sortBy, String sortOrder) {
        if (sortBy == null || sortBy.isEmpty()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        
        Sort.Direction direction = "asc".equalsIgnoreCase(sortOrder) ? 
                Sort.Direction.ASC : Sort.Direction.DESC;
        
        return Sort.by(direction, sortBy);
    }

    @Transactional
    public CargoDTO updateCargo(Long id, Long ownerId, UpdateCargoDTO dto) {
        Cargo cargo = cargoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cargo not found"));

        if (!cargo.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        cargo.setName(dto.getName());
        cargo.setDescription(dto.getDescription());
        cargo.setWeight(dto.getWeight());
        cargo = cargoRepository.save(cargo);

        if (dto.getLatitude() != null && dto.getLongitude() != null) {
            CargoLocation location = cargoLocationRepository.findFirstByCargoIdOrderByUpdatedAtDesc(id)
                    .orElse(new CargoLocation());
            location.setCargo(cargo);
            location.setLatitude(dto.getLatitude());
            location.setLongitude(dto.getLongitude());
            location.setAddress(dto.getAddress());
            location.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
            cargoLocationRepository.save(location);
        }

        return convertToDTO(cargo);
    }

    @Transactional
    public void deleteCargo(Long id, Long ownerId) {
        Cargo cargo = cargoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cargo not found"));

        if (!cargo.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        cargoRepository.delete(cargo);
    }

    private CargoDTO convertToDTO(Cargo cargo) {
        CargoDTO dto = new CargoDTO();
        dto.setId(cargo.getId());
        dto.setOwnerId(cargo.getOwner().getId());
        dto.setName(cargo.getName());
        dto.setDescription(cargo.getDescription());
        dto.setWeight(cargo.getWeight());
        dto.setCreatedAt(cargo.getCreatedAt());

        cargoLocationRepository.findFirstByCargoIdOrderByUpdatedAtDesc(cargo.getId())
                .ifPresent(location -> {
                    CargoLocationDTO locationDTO = new CargoLocationDTO();
                    locationDTO.setId(location.getId());
                    locationDTO.setCargoId(location.getCargo().getId());
                    locationDTO.setLatitude(location.getLatitude());
                    locationDTO.setLongitude(location.getLongitude());
                    locationDTO.setAddress(location.getAddress());
                    locationDTO.setUpdatedAt(location.getUpdatedAt());
                    dto.setLocation(locationDTO);
                });

        return dto;
    }
}

