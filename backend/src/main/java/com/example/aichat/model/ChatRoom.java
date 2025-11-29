package com.example.aichat.model;

import com.volcengine.ark.runtime.model.completion.chat.ChatMessage;
import java.util.List;


public class ChatRoom {

    private long roomId;
    private List<ChatMessage> messages;

    public long getRoomId() {
        return roomId;
    }

    public void setRoomId(long roomId) {
        this.roomId = roomId;
    }

    public List<ChatMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<ChatMessage> messages) {
        this.messages = messages;
    }

    @Override
    public String toString() {
        return "ChatRoom{" +
                "roomId=" + roomId +
                ", messages=" + messages +
                '}';
    }
}
