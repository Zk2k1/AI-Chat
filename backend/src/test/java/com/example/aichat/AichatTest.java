package com.example.aichat;

import com.example.aichat.service.AiManage;
import com.volcengine.ark.runtime.model.bot.completion.chat.BotChatCompletionRequest;
import com.volcengine.ark.runtime.model.bot.completion.chat.BotChatCompletionResult;
import com.volcengine.ark.runtime.model.completion.chat.ChatMessage;
import com.volcengine.ark.runtime.model.completion.chat.ChatMessageRole;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

@SpringBootTest
public class AichatTest {
//    @Value("${ai.apiKey}")
//    String apiKey;

//    @Resource
//    ArkService service;

//    @BeforeEach
//    public void setUp() {
//        ConnectionPool connectionPool = new ConnectionPool(5, 1, TimeUnit.SECONDS);
//        Dispatcher dispatcher = new Dispatcher();
//        service = ArkService.builder()
//                .dispatcher(dispatcher)
//                .connectionPool(connectionPool)
//                .baseUrl("https://ark.cn-beijing.volces.com/api/v3/").apiKey(apiKey).build();
//    }

    @Resource
    private AiManage aiManage;

    @Test
    public void doTest() {
//        System.out.println("\n----- standard request -----");
//        final List<ChatMessage> messages = new ArrayList<>();
//        final ChatMessage systemMessage = ChatMessage.builder().role(ChatMessageRole.SYSTEM).content("你是一个java编程专家").build();
//        final ChatMessage userMessage = ChatMessage.builder().role(ChatMessageRole.USER).content("给我一个java示例程序").build();
//        messages.add(systemMessage);
//        messages.add(userMessage);
//
//        BotChatCompletionRequest chatCompletionRequest = BotChatCompletionRequest.builder()
//                .botId("bot-20251128102823-ngddb")
//                .messages(messages)
//                .build();
//
//        BotChatCompletionResult chatCompletionResult =  service.createBotChatCompletion(chatCompletionRequest);
//        chatCompletionResult.getChoices().forEach(choice -> System.out.println(choice.getMessage().getContent()));
//        // the references example
//        if (chatCompletionResult.getReferences() != null) {
//            chatCompletionResult.getReferences().forEach(ref -> System.out.println(ref.getUrl()));
//        }

        String systemPrompt = "你是java编程专家";
        String userPrompt = "给我一个java示例程序";
        String answer = aiManage.doChat(systemPrompt, userPrompt);
        System.out.println(answer);

//        System.out.println("\n----- streaming request -----");
//        final List<ChatMessage> streamMessages = new ArrayList<>();
//        final ChatMessage streamSystemMessage = ChatMessage.builder().role(ChatMessageRole.SYSTEM).content("你是豆包，是由字节跳动开发的 AI 人工智能助手").build();
//        final ChatMessage streamUserMessage = ChatMessage.builder().role(ChatMessageRole.USER).content("常见的十字花科植物有哪些？").build();
//        streamMessages.add(streamSystemMessage);
//        streamMessages.add(streamUserMessage);
//
//        BotChatCompletionRequest streamChatCompletionRequest = BotChatCompletionRequest.builder()
//                .botId("bot-20251128102823-ngddb")
//                .messages(streamMessages)
//                .build();
//
//        service.streamBotChatCompletion(streamChatCompletionRequest)
//                .doOnError(Throwable::printStackTrace)
//                .blockingForEach(
//                        choice -> {
//                            if (choice.getReferences() != null && !choice.getReferences().isEmpty()) {
//                                choice.getReferences().forEach(ref -> System.out.println(ref.getUrl()));
//                            }
//                            if (!choice.getChoices().isEmpty()) {
//                                System.out.print(choice.getChoices().get(0).getMessage().getContent());
//                            }
//                        }
//                );

        // shutdown service after all requests is finished
//        service.shutdownExecutor();
    }
}
