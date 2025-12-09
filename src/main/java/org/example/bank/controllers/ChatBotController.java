package org.example.bank.controllers;

import org.example.bank.services.ChatBotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
public class ChatBotController {

    @Autowired
    private ChatBotService chatBotService;

    @PostMapping("/message")
    public ResponseEntity<Map<String, String>> sendMessage(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        if (message == null || message.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("response", "Сообщение не может быть пустым"));
        }
        
        String response = chatBotService.processMessage(message);
        return ResponseEntity.ok(Map.of("response", response));
    }
}


