package org.example.bank.services;

import org.example.bank.dto.TransportDTO;
import org.example.bank.entities.Carrier;
import org.example.bank.entities.Transport;
import org.example.bank.repositories.CarrierRepository;
import org.example.bank.repositories.TransportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransportService {

    @Autowired
    private TransportRepository transportRepository;

    @Autowired
    private CarrierRepository carrierRepository;

    @Transactional
    public TransportDTO createTransport(Long carrierId, TransportDTO dto) {
        Carrier carrier = carrierRepository.findById(carrierId)
                .orElseThrow(() -> new RuntimeException("Carrier not found"));

        Transport transport = new Transport();
        transport.setCarrier(carrier);
        transport.setType(dto.getType());
        transport.setNumberPlate(dto.getNumberPlate());
        transport.setCapacity(dto.getCapacity());

        transport = transportRepository.save(transport);
        return convertToDTO(transport);
    }

    public List<TransportDTO> getTransportsByCarrier(Long carrierId) {
        return transportRepository.findByCarrierId(carrierId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public TransportDTO getTransportById(Long id) {
        Transport transport = transportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transport not found"));
        return convertToDTO(transport);
    }

    @Transactional
    public TransportDTO updateTransport(Long id, Long carrierId, TransportDTO dto) {
        Transport transport = transportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transport not found"));

        if (!transport.getCarrier().getId().equals(carrierId)) {
            throw new RuntimeException("Unauthorized");
        }

        transport.setType(dto.getType());
        transport.setNumberPlate(dto.getNumberPlate());
        transport.setCapacity(dto.getCapacity());

        transport = transportRepository.save(transport);
        return convertToDTO(transport);
    }

    @Transactional
    public void deleteTransport(Long id, Long carrierId) {
        Transport transport = transportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transport not found"));

        if (!transport.getCarrier().getId().equals(carrierId)) {
            throw new RuntimeException("Unauthorized");
        }

        transportRepository.delete(transport);
    }

    private TransportDTO convertToDTO(Transport transport) {
        TransportDTO dto = new TransportDTO();
        dto.setId(transport.getId());
        dto.setCarrierId(transport.getCarrier().getId());
        dto.setType(transport.getType());
        dto.setNumberPlate(transport.getNumberPlate());
        dto.setCapacity(transport.getCapacity());
        return dto;
    }
}




