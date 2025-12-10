package org.example.bank.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.bank.UserDetailsImpl;
import org.example.bank.dto.*;
import org.example.bank.entities.*;
import org.example.bank.models.MessageType;
import org.example.bank.models.RequestStatus;
import org.example.bank.models.User;
import org.example.bank.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private CargoRepository cargoRepository;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public MessageDTO sendMessage(Long userId, CreateMessageDTO dto) {
        Request request = requestRepository.findById(dto.getRequestId())
                .orElseThrow(() -> new RuntimeException("Request not found"));

        // Проверяем, что пользователь участвует в заявке
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User receiver;
        if (user.getId().equals(request.getOwner().getUser().getId())) {
            // Отправитель - OWNER, получатель - CARRIER
            if (request.getCarrier() == null) {
                throw new RuntimeException("Carrier not assigned to request");
            }
            receiver = request.getCarrier().getUser();
        } else if (request.getCarrier() != null && user.getId().equals(request.getCarrier().getUser().getId())) {
            // Отправитель - CARRIER, получатель - OWNER
            receiver = request.getOwner().getUser();
        } else {
            throw new RuntimeException("Unauthorized: User is not part of this request");
        }

        Message message = new Message();
        message.setRequest(request);
        message.setSender(user);
        message.setReceiver(receiver);
        message.setText(dto.getText());
        message.setType(dto.getType() != null ? dto.getType() : MessageType.TEXT);

        message = messageRepository.save(message);
        return convertToDTO(message);
    }

    @Transactional
    public MessageDTO sendRouteMessage(Long userId, CreateRouteMessageDTO dto) {
        Request request = requestRepository.findById(dto.getRequestId())
                .orElseThrow(() -> new RuntimeException("Request not found"));

        // Проверяем, что пользователь - CARRIER и заявка ACCEPTED
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getCarrier() == null || !request.getCarrier().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: Only carrier can send route messages");
        }

        if (request.getStatus() != RequestStatus.ACCEPTED) {
            throw new RuntimeException("Route can only be sent for ACCEPTED requests");
        }

        User receiver = request.getOwner().getUser();

        // Создаем JSON с данными маршрута
        try {
            RouteData routeData = new RouteData();
            routeData.setStartAddress(dto.getStartAddress());
            routeData.setEndAddress(dto.getEndAddress());
            routeData.setStartLat(dto.getStartLat());
            routeData.setStartLng(dto.getStartLng());
            routeData.setEndLat(dto.getEndLat());
            routeData.setEndLng(dto.getEndLng());

            String routeJson = objectMapper.writeValueAsString(routeData);

            Message message = new Message();
            message.setRequest(request);
            message.setSender(user);
            message.setReceiver(receiver);
            message.setText(routeJson);
            message.setType(MessageType.ROUTE);

            message = messageRepository.save(message);
            return convertToDTO(message);
        } catch (Exception e) {
            throw new RuntimeException("Error creating route message", e);
        }
    }

    @Transactional
    public RouteDTO confirmRoute(Long userId, Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        Request request = message.getRequest();

        // Проверяем, что пользователь - OWNER и это сообщение типа ROUTE
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!request.getOwner().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: Only owner can confirm route");
        }

        if (message.getType() != MessageType.ROUTE) {
            throw new RuntimeException("Message is not a route message");
        }

        // Парсим данные маршрута из JSON
        try {
            RouteData routeData = objectMapper.readValue(message.getText(), RouteData.class);

            // Создаем маршрут
            Route route = new Route();
            route.setCargo(request.getCargo());
            route.setStartAddress(routeData.getStartAddress());
            route.setEndAddress(routeData.getEndAddress());
            route.setStartLat(routeData.getStartLat());
            route.setStartLng(routeData.getStartLng());
            route.setEndLat(routeData.getEndLat());
            route.setEndLng(routeData.getEndLng());

            route = routeRepository.save(route);

            // Сохраняем подтвержденный маршрут в заявке
            request.setConfirmedRoute(route);
            request.setRouteConfirmedAt(new java.sql.Timestamp(System.currentTimeMillis()));
            request.setRouteConfirmedBy(user);
            
            // Обновляем статус заявки на IN_PROGRESS
            request.setStatus(RequestStatus.IN_PROGRESS);
            request.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
            requestRepository.save(request);

            return convertRouteToDTO(route);
        } catch (Exception e) {
            throw new RuntimeException("Error confirming route", e);
        }
    }

    public List<MessageDTO> getMessagesByRequest(Long requestId, Long userId) {
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Проверяем, что пользователь участвует в заявке
        boolean isOwner = request.getOwner().getUser().getId().equals(userId);
        boolean isCarrier = request.getCarrier() != null && request.getCarrier().getUser().getId().equals(userId);

        if (!isOwner && !isCarrier) {
            throw new RuntimeException("Unauthorized: User is not part of this request");
        }

        // Убираем проверку статуса - показываем сообщения для всех заявок с перевозчиком

        List<Message> messages = messageRepository.findMessagesByRequestId(requestId);
        return messages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private MessageDTO convertToDTO(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setRequestId(message.getRequest().getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getUsername());
        dto.setReceiverId(message.getReceiver().getId());
        dto.setReceiverName(message.getReceiver().getUsername());
        dto.setText(message.getText());
        dto.setType(message.getType());
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }

    private RouteDTO convertRouteToDTO(Route route) {
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

    // Внутренний класс для парсинга JSON маршрута
    private static class RouteData {
        private String startAddress;
        private String endAddress;
        private BigDecimal startLat;
        private BigDecimal startLng;
        private BigDecimal endLat;
        private BigDecimal endLng;
        private Double distance; // расстояние в метрах
        private Double time; // время в секундах

        public String getStartAddress() {
            return startAddress;
        }

        public void setStartAddress(String startAddress) {
            this.startAddress = startAddress;
        }

        public String getEndAddress() {
            return endAddress;
        }

        public void setEndAddress(String endAddress) {
            this.endAddress = endAddress;
        }

        public BigDecimal getStartLat() {
            return startLat;
        }

        public void setStartLat(BigDecimal startLat) {
            this.startLat = startLat;
        }

        public BigDecimal getStartLng() {
            return startLng;
        }

        public void setStartLng(BigDecimal startLng) {
            this.startLng = startLng;
        }

        public BigDecimal getEndLat() {
            return endLat;
        }

        public void setEndLat(BigDecimal endLat) {
            this.endLat = endLat;
        }

        public BigDecimal getEndLng() {
            return endLng;
        }

        public void setEndLng(BigDecimal endLng) {
            this.endLng = endLng;
        }

        public Double getDistance() {
            return distance;
        }

        public void setDistance(Double distance) {
            this.distance = distance;
        }

        public Double getTime() {
            return time;
        }

        public void setTime(Double time) {
            this.time = time;
        }
    }
}

