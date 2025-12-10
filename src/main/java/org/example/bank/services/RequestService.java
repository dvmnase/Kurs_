package org.example.bank.services;

import org.example.bank.dto.*;
import org.example.bank.entities.Cargo;
import org.example.bank.entities.Carrier;
import org.example.bank.entities.Owner;
import org.example.bank.entities.Request;
import org.example.bank.models.RequestStatus;
import org.example.bank.repositories.CargoRepository;
import org.example.bank.repositories.CarrierRepository;
import org.example.bank.repositories.OwnerRepository;
import org.example.bank.repositories.RequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RequestService {

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private OwnerRepository ownerRepository;

    @Autowired
    private CarrierRepository carrierRepository;

    @Autowired
    private CargoService cargoService;

    @Transactional
    public RequestDTO createRequest(Long ownerId, CreateRequestDTO dto) {
        Owner owner = ownerRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        Cargo cargo = cargoRepository.findById(dto.getCargoId())
                .orElseThrow(() -> new RuntimeException("Cargo not found"));

        if (!cargo.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        Request request = new Request();
        request.setCargo(cargo);
        request.setOwner(owner);
        request.setPickupDate(dto.getPickupDate());
        request.setDeliveryDate(dto.getDeliveryDate());
        request.setComment(dto.getComment());
        request.setStatus(RequestStatus.NEW);

        if (dto.getCarrierId() != null) {
            Carrier carrier = carrierRepository.findById(dto.getCarrierId())
                    .orElseThrow(() -> new RuntimeException("Carrier not found"));
            request.setCarrier(carrier);
            request.setStatus(RequestStatus.PENDING);
        }

        request = requestRepository.save(request);
        return convertToDTO(request);
    }

    public List<RequestDTO> getRequestsByOwner(Long ownerId) {
        return requestRepository.findByOwnerId(ownerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<RequestDTO> getRequestsByCarrier(Long carrierId) {
        return requestRepository.findByCarrierId(carrierId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<RequestDTO> getAvailableRequests() {
        return requestRepository.findAvailableRequests(RequestStatus.NEW).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public RequestDTO getRequestById(Long id) {
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        return convertToDTO(request);
    }

    @Transactional
    public RequestDTO updateRequest(Long id, Long ownerId, UpdateRequestDTO dto) {
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (dto.getPickupDate() != null) {
            request.setPickupDate(dto.getPickupDate());
        }
        if (dto.getDeliveryDate() != null) {
            request.setDeliveryDate(dto.getDeliveryDate());
        }
        if (dto.getComment() != null) {
            request.setComment(dto.getComment());
        }
        if (dto.getStatus() != null) {
            request.setStatus(dto.getStatus());
        }
        if (dto.getCarrierId() != null) {
            if (dto.getCarrierId() == -1) {
                // Если передано -1, удаляем перевозчика
                request.setCarrier(null);
                if (request.getStatus() == RequestStatus.PENDING || request.getStatus() == RequestStatus.ACCEPTED) {
                    request.setStatus(RequestStatus.NEW);
                }
            } else {
                Carrier carrier = carrierRepository.findById(dto.getCarrierId())
                        .orElseThrow(() -> new RuntimeException("Carrier not found"));
                request.setCarrier(carrier);
                // Если перевозчик назначен, меняем статус на PENDING
                if (request.getStatus() == RequestStatus.NEW) {
                    request.setStatus(RequestStatus.PENDING);
                }
            }
        }
        // Если carrierId не передан (null), оставляем текущего перевозчика без изменений
        request.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));

        request = requestRepository.save(request);
        return convertToDTO(request);
    }

    @Transactional
    public RequestDTO acceptRequest(Long id, Long carrierId) {
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        Carrier carrier = carrierRepository.findById(carrierId)
                .orElseThrow(() -> new RuntimeException("Carrier not found"));

        request.setCarrier(carrier);
        request.setStatus(RequestStatus.ACCEPTED);
        request.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));

        request = requestRepository.save(request);
        return convertToDTO(request);
    }

    @Transactional
    public RequestDTO declineRequest(Long id, Long carrierId) {
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getCarrier() != null && !request.getCarrier().getId().equals(carrierId)) {
            throw new RuntimeException("Unauthorized");
        }

        request.setStatus(RequestStatus.DECLINED);
        request.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));

        request = requestRepository.save(request);
        return convertToDTO(request);
    }

    @Transactional
    public RequestDTO updateRequestStatus(Long id, Long carrierId, RequestStatus status) {
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getCarrier() == null || !request.getCarrier().getId().equals(carrierId)) {
            throw new RuntimeException("Unauthorized: Only assigned carrier can update status");
        }

        // Проверяем, что статус может быть изменен перевозчиком
        if (status != RequestStatus.ACCEPTED && status != RequestStatus.IN_PROGRESS && status != RequestStatus.DECLINED) {
            throw new RuntimeException("Invalid status for carrier");
        }

        request.setStatus(status);
        request.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));

        request = requestRepository.save(request);
        return convertToDTO(request);
    }

    @Transactional
    public void deleteRequest(Long id, Long ownerId) {
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        requestRepository.delete(request);
    }

    private RequestDTO convertToDTO(Request request) {
        RequestDTO dto = new RequestDTO();
        dto.setId(request.getId());
        dto.setCargoId(request.getCargo().getId());
        dto.setOwnerId(request.getOwner().getId());
        dto.setOwnerName(request.getOwner().getFullName());
        if (request.getCarrier() != null) {
            dto.setCarrierId(request.getCarrier().getId());
            dto.setCarrierName(request.getCarrier().getCompanyName());
        }
        dto.setStatus(request.getStatus());
        dto.setPickupDate(request.getPickupDate());
        dto.setDeliveryDate(request.getDeliveryDate());
        dto.setComment(request.getComment());
        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());
        dto.setCargo(cargoService.getCargoById(request.getCargo().getId()));
        return dto;
    }
}

