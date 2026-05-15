package org.example.bank.services;

import org.example.bank.dto.*;
import org.example.bank.entities.*;
import org.example.bank.models.BidStatus;
import org.example.bank.models.RequestStatus;
import org.example.bank.models.TenderStatus;
import org.example.bank.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TenderService {

    @Autowired
    private TenderRepository tenderRepository;

    @Autowired
    private TenderBidRepository tenderBidRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private OwnerRepository ownerRepository;

    @Autowired
    private CarrierRepository carrierRepository;

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private CargoService cargoService;

    @Transactional
    public TenderDTO createTender(Long ownerId, CreateTenderDTO dto) {
        Owner owner = ownerRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Владелец не найден"));

        Cargo cargo = cargoRepository.findById(dto.getCargoId())
                .orElseThrow(() -> new RuntimeException("Груз не найден"));

        if (!cargo.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Нет доступа к грузу");
        }

        if (tenderRepository.existsByCargoIdAndStatus(cargo.getId(), TenderStatus.OPEN)) {
            throw new RuntimeException("По этому грузу уже открыт тендер");
        }

        if (dto.getEndAt() == null) {
            throw new RuntimeException("Укажите срок окончания тендера");
        }

        Timestamp now = new Timestamp(System.currentTimeMillis());
        if (dto.getEndAt().before(now)) {
            throw new RuntimeException("Срок окончания тендера должен быть в будущем");
        }

        Tender tender = new Tender();
        tender.setCargo(cargo);
        tender.setOwner(owner);
        tender.setStatus(TenderStatus.OPEN);
        tender.setEndAt(dto.getEndAt());
        tender.setConditions(dto.getConditions());
        tender.setExpectedPrice(dto.getExpectedPrice());

        tender = tenderRepository.save(tender);
        return convertToDTO(tender, false);
    }

    public List<TenderDTO> getTendersByOwner(Long ownerId) {
        return tenderRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .map(t -> convertToDTO(t, false))
                .collect(Collectors.toList());
    }

    public TenderDTO getTenderByIdForOwner(Long tenderId, Long ownerId) {
        Tender tender = tenderRepository.findById(tenderId)
                .orElseThrow(() -> new RuntimeException("Тендер не найден"));

        if (!tender.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Нет доступа к тендеру");
        }

        return convertToDTO(tender, true);
    }

    public List<TenderDTO> getOpenTenders() {
        closeExpiredTenders();
        return tenderRepository.findByStatusOrderByCreatedAtDesc(TenderStatus.OPEN).stream()
                .map(t -> convertToDTO(t, false))
                .collect(Collectors.toList());
    }

    public TenderDTO getTenderByIdForCarrier(Long tenderId, Long carrierId) {
        closeExpiredTenders();
        Tender tender = tenderRepository.findById(tenderId)
                .orElseThrow(() -> new RuntimeException("Тендер не найден"));

        TenderDTO dto = convertToDTO(tender, false);
        tenderBidRepository.findByTenderIdAndCarrierId(tenderId, carrierId)
                .ifPresent(bid -> dto.setBids(List.of(convertBidToDTO(bid))));
        return dto;
    }

    public List<TenderBidDTO> getMyBids(Long carrierId) {
        return tenderBidRepository.findByCarrierIdOrderByCreatedAtDesc(carrierId).stream()
                .map(this::convertBidToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TenderBidDTO submitBid(Long tenderId, Long carrierId, CreateTenderBidDTO dto) {
        closeExpiredTenders();

        Tender tender = tenderRepository.findById(tenderId)
                .orElseThrow(() -> new RuntimeException("Тендер не найден"));

        if (tender.getStatus() != TenderStatus.OPEN) {
            throw new RuntimeException("Тендер закрыт");
        }

        Timestamp now = new Timestamp(System.currentTimeMillis());
        if (tender.getEndAt().before(now)) {
            tender.setStatus(TenderStatus.CLOSED);
            tender.setClosedAt(now);
            tenderRepository.save(tender);
            throw new RuntimeException("Срок подачи предложений истёк");
        }

        if (dto.getPrice() == null || dto.getDeliveryDate() == null) {
            throw new RuntimeException("Укажите цену и срок доставки");
        }

        Carrier carrier = carrierRepository.findById(carrierId)
                .orElseThrow(() -> new RuntimeException("Перевозчик не найден"));

        TenderBid bid = tenderBidRepository.findByTenderIdAndCarrierId(tenderId, carrierId)
                .orElse(null);

        if (bid != null) {
            if (bid.getStatus() != BidStatus.PENDING) {
                throw new RuntimeException("Предложение уже обработано");
            }
            bid.setPrice(dto.getPrice());
            bid.setDeliveryDate(dto.getDeliveryDate());
            bid.setComment(dto.getComment());
        } else {
            bid = new TenderBid();
            bid.setTender(tender);
            bid.setCarrier(carrier);
            bid.setPrice(dto.getPrice());
            bid.setDeliveryDate(dto.getDeliveryDate());
            bid.setComment(dto.getComment());
            bid.setStatus(BidStatus.PENDING);
        }

        bid = tenderBidRepository.save(bid);
        return convertBidToDTO(bid);
    }

    @Transactional
    public TenderDTO acceptBid(Long tenderId, Long bidId, Long ownerId) {
        Tender tender = tenderRepository.findById(tenderId)
                .orElseThrow(() -> new RuntimeException("Тендер не найден"));

        if (!tender.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Нет доступа к тендеру");
        }

        if (tender.getStatus() != TenderStatus.OPEN) {
            throw new RuntimeException("Тендер уже закрыт");
        }

        TenderBid acceptedBid = tenderBidRepository.findById(bidId)
                .orElseThrow(() -> new RuntimeException("Предложение не найдено"));

        if (!acceptedBid.getTender().getId().equals(tenderId)) {
            throw new RuntimeException("Предложение не относится к этому тендеру");
        }

        if (acceptedBid.getStatus() != BidStatus.PENDING) {
            throw new RuntimeException("Предложение уже обработано");
        }

        List<TenderBid> allBids = tenderBidRepository.findByTenderIdOrderByCreatedAtAsc(tenderId);
        for (TenderBid bid : allBids) {
            if (bid.getId().equals(bidId)) {
                bid.setStatus(BidStatus.ACCEPTED);
            } else if (bid.getStatus() == BidStatus.PENDING) {
                bid.setStatus(BidStatus.REJECTED);
            }
            tenderBidRepository.save(bid);
        }

        Timestamp now = new Timestamp(System.currentTimeMillis());
        tender.setStatus(TenderStatus.CLOSED);
        tender.setClosedAt(now);

        Request request = new Request();
        request.setCargo(tender.getCargo());
        request.setOwner(tender.getOwner());
        request.setCarrier(acceptedBid.getCarrier());
        request.setStatus(RequestStatus.ACCEPTED);
        request.setDeliveryDate(acceptedBid.getDeliveryDate());

        StringBuilder comment = new StringBuilder();
        comment.append("Заявка из тендера №").append(tender.getId());
        comment.append(". Цена: ").append(acceptedBid.getPrice()).append(" руб.");
        if (acceptedBid.getComment() != null && !acceptedBid.getComment().isBlank()) {
            comment.append(". ").append(acceptedBid.getComment());
        }
        request.setComment(comment.toString());
        request.setUpdatedAt(now);

        request = requestRepository.save(request);
        tender.setRequest(request);
        tender = tenderRepository.save(tender);

        return convertToDTO(tender, true);
    }

    @Transactional
    public void closeExpiredTenders() {
        Timestamp now = new Timestamp(System.currentTimeMillis());
        List<Tender> openTenders = tenderRepository.findByStatusOrderByCreatedAtDesc(TenderStatus.OPEN);
        for (Tender tender : openTenders) {
            if (tender.getEndAt().before(now)) {
                tender.setStatus(TenderStatus.CLOSED);
                tender.setClosedAt(now);
                tenderRepository.save(tender);
            }
        }
    }

    private TenderDTO convertToDTO(Tender tender, boolean includeBids) {
        TenderDTO dto = new TenderDTO();
        dto.setId(tender.getId());
        dto.setCargoId(tender.getCargo().getId());
        dto.setCargoName(tender.getCargo().getName());
        dto.setOwnerId(tender.getOwner().getId());
        dto.setStatus(tender.getStatus());
        dto.setEndAt(tender.getEndAt());
        dto.setConditions(tender.getConditions());
        dto.setExpectedPrice(tender.getExpectedPrice());
        dto.setCreatedAt(tender.getCreatedAt());
        dto.setClosedAt(tender.getClosedAt());
        if (tender.getRequest() != null) {
            dto.setRequestId(tender.getRequest().getId());
        }
        dto.setBidsCount(tenderBidRepository.findByTenderIdOrderByCreatedAtAsc(tender.getId()).size());

        try {
            dto.setCargo(cargoService.getCargoById(tender.getCargo().getId()));
        } catch (Exception ignored) {
        }

        if (includeBids) {
            dto.setBids(tenderBidRepository.findByTenderIdOrderByCreatedAtAsc(tender.getId()).stream()
                    .map(this::convertBidToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private TenderBidDTO convertBidToDTO(TenderBid bid) {
        TenderBidDTO dto = new TenderBidDTO();
        dto.setId(bid.getId());
        dto.setTenderId(bid.getTender().getId());
        dto.setCarrierId(bid.getCarrier().getId());
        dto.setCarrierName(bid.getCarrier().getCompanyName() != null
                ? bid.getCarrier().getCompanyName()
                : "Перевозчик #" + bid.getCarrier().getId());
        dto.setPrice(bid.getPrice());
        dto.setDeliveryDate(bid.getDeliveryDate());
        dto.setComment(bid.getComment());
        dto.setStatus(bid.getStatus());
        dto.setCreatedAt(bid.getCreatedAt());
        return dto;
    }
}
