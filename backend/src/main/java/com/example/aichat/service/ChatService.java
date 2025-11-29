package com.example.aichat.service;

import com.example.aichat.model.ChatRoom;

import java.util.List;

public interface ChatService {
    //用户提供聊天室房间，以及提示词；
    String doChat(long roomId, String userPrompt);
    //返回对话列表；
    List<ChatRoom> getChatRoomList();
}
