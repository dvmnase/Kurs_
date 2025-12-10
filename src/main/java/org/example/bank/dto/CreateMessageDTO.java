package org.example.bank.dto;

import org.example.bank.models.MessageType;

public class CreateMessageDTO {
    private Long requestId;
    private String text;
    private MessageType type = MessageType.TEXT;

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }
}

