package org.example.bank.controllers;

import org.example.bank.UserDetailsImpl;
import org.example.bank.dto.*;
import org.example.bank.services.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageDTO> sendMessage(@RequestBody CreateMessageDTO dto, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        return ResponseEntity.ok(messageService.sendMessage(userId, dto));
    }

    @PostMapping("/route")
    public ResponseEntity<MessageDTO> sendRouteMessage(@RequestBody CreateRouteMessageDTO dto, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        return ResponseEntity.ok(messageService.sendRouteMessage(userId, dto));
    }

    @PostMapping("/route/{messageId}/confirm")
    public ResponseEntity<RouteDTO> confirmRoute(@PathVariable Long messageId, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        return ResponseEntity.ok(messageService.confirmRoute(userId, messageId));
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<MessageDTO>> getMessagesByRequest(@PathVariable Long requestId, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        return ResponseEntity.ok(messageService.getMessagesByRequest(requestId, userId));
    }
}

