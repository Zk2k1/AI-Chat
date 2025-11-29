import { ref, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { chatApi } from '../api/chat';

interface Message {
  id: number;
  content: string;
  isAI: boolean;
}

export default {
  name: 'ChatRoom',
  setup() {
    const route = useRoute();
    const parseRouteRoomId = () => {
      const p = route.params.roomId as string | undefined;
      if (!p) return NaN;
      const n = Number(p);
      return Number.isNaN(n) ? NaN : n;
    };

    const generateRoomId = () => {
      // 使用 cryptographically strong 随机生成 6 位数字，降概率碰撞
      try {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        return 100000 + (arr[0] % 900000);
      } catch (e) {
        return Math.floor(Math.random() * 900000) + 100000;
      }
    };

    const router = useRouter();
    const initialRouteId = parseRouteRoomId();
    const roomId = ref<number>(Number.isNaN(initialRouteId) ? generateRoomId() : initialRouteId);
    // 如果路由没有 roomId，则把生成的 id 写入 URL，便于分享与区分
    if (Number.isNaN(initialRouteId)) {
      // 使用 replace 避免影响浏览器历史（用户期望新打开即拥有该 id）
      router.replace(`/chat/${roomId.value}`).catch(() => {});
    }
    const messages = ref<Message[]>([]);
    const userInput = ref('');
    const isGameStarted = ref(false);
    const isGameEnded = ref(false);
    const isLoading = ref(false);
    const messagesContainer = ref<HTMLElement | null>(null);

    // 历史对话（本地存储）
    interface Conversation {
      id: number;
      roomId: number;
      title: string;
      messages: Message[];
    }

    const historyConversations = ref<Conversation[]>([]);
    const activeConversationId = ref<number | null>(null);

    // 使用全局历史 key，保存所有房间的对话记录
    const GLOBAL_HISTORY_KEY = 'chat_history_all';

    const loadHistory = () => {
      try {
        const raw = localStorage.getItem(GLOBAL_HISTORY_KEY);
        if (raw) {
          historyConversations.value = JSON.parse(raw);
        } else {
          historyConversations.value = [];
        }
      } catch (e) {
        console.error('loadHistory error', e);
        historyConversations.value = [];
      }
    };

    const saveHistory = () => {
      try {
        localStorage.setItem(GLOBAL_HISTORY_KEY, JSON.stringify(historyConversations.value));
      } catch (e) {
        console.error('saveHistory error', e);
      }
    };

    const saveCurrentConversation = () => {
      if (!messages.value.length) return;
      const last = historyConversations.value[0];
      try {
        // 如果最近一条历史属于同一房间，则更新该条记录（避免在结束时产生重复会话）
        if (last && last.roomId === roomId.value) {
          if (JSON.stringify(last.messages) === JSON.stringify(messages.value)) {
            activeConversationId.value = last.id;
            return;
          }
          // 更新最近一条的消息为当前会话内容，并保持 id 不变
          last.messages = JSON.parse(JSON.stringify(messages.value));
          last.title = `对话 ${roomId.value}`;
          saveHistory();
          activeConversationId.value = last.id;
          return;
        }
      } catch (e) {
        // stringify 可能失败，则继续创建新会话保存
      }

      const title = `对话 ${roomId.value}`;
      const conv: Conversation = {
        id: Date.now(),
        roomId: roomId.value,
        title,
        messages: JSON.parse(JSON.stringify(messages.value)),
      };
      historyConversations.value.unshift(conv);
      // keep recent 50
      if (historyConversations.value.length > 50) historyConversations.value.splice(50);
      saveHistory();
      activeConversationId.value = conv.id;
    };

    const openConversation = (id: number) => {
      const conv = historyConversations.value.find((c) => c.id === id);
      if (!conv) return;
      // 切换到该对话对应的房间，并加载消息
      roomId.value = conv.roomId;
      messages.value = conv.messages.map((m) => ({ ...m }));
      activeConversationId.value = id;
      scrollToBottom();
    };

    const deleteConversation = (id: number) => {
      const idx = historyConversations.value.findIndex((c) => c.id === id);
      if (idx >= 0) {
        historyConversations.value.splice(idx, 1);
        saveHistory();
        if (activeConversationId.value === id) {
          activeConversationId.value = null;
          messages.value = [];
        }
      }
    };

    const newConversation = () => {
      // 若当前有消息，先保存当前会话到历史
      if (messages.value.length) {
        saveCurrentConversation();
      }

      // 清空当前会话并生成新的房间号
      messages.value = [];
      userInput.value = '';
      isGameStarted.value = false;
      isGameEnded.value = false;
      activeConversationId.value = null;
      roomId.value = generateRoomId();
      // 将新的房间 id 同步到 URL，便于区分每次新会话
      router.push(`/chat/${roomId.value}`).catch(() => {});
      loadHistory();
      nextTick(scrollToBottom);
    };

    // 初始加载历史
    loadHistory();

    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    };

    const addMessage = (content: string, isAI: boolean) => {
      messages.value.push({
        id: Date.now(),
        content,
        isAI,
      });
      scrollToBottom();
    };

    const sendMessage = async (content: string) => {
      if (!content.trim() || isLoading.value) return;

      addMessage(content, false);
      userInput.value = '';
      isLoading.value = true;

      try {
        const response = await chatApi.sendMessage(roomId.value, content);
        addMessage(response, true);

        if (response.includes('游戏已结束')) {
          isGameEnded.value = true;
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        addMessage('发送消息失败，请重试', true);
      } finally {
        isLoading.value = false;
      }
    };

    const startGame = async () => {
      if (isGameStarted.value) return;
      // allow repeated cycles: clear ended flag when starting
      isGameEnded.value = false;
      isGameStarted.value = true;
      await sendMessage('开始');
      // 开始游戏后将当前对话保存到历史（包含用户的开始消息和可能的 AI 回复）
      saveCurrentConversation();
    };

    const endGame = async () => {
      // Only allow ending when a game is started
      if (!isGameStarted.value) return;
      // 发送更明确的结束文字，让用户气泡显示“结束游戏”内容
      await sendMessage('结束游戏');
      // 标记为已结束并结束当前运行状态，允许后续再次开始
      isGameEnded.value = true;
      isGameStarted.value = false;
      // 保存当前对话到本地历史
      saveCurrentConversation();
    };

    const handleSend = () => {
      if (userInput.value.trim()) {
        sendMessage(userInput.value);
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    return () => (
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
        <div class="bg-white shadow-md border-b-2 border-gray-200 p-4">
          <div class="max-w-6xl mx-auto">
            <h2 class="text-2xl font-bold text-gray-800 text-center">AI 脑筋急转弯</h2>
            <p class="text-center text-gray-600 mt-1">房间号: {roomId.value}</p>
          </div>
        </div>

        <div class="flex-1 overflow-hidden p-4">
          <div class="max-w-6xl mx-auto w-full flex gap-4 h-full">
            {/* 侧边栏 */}
            <div class="w-56 bg-white rounded-r-xl shadow p-3 border-r-2 border-gray-200 flex flex-col h-full">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-medium">历史对话</h3>
                <div class="flex gap-2">
                  <button
                    onClick={newConversation}
                    class="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
                  >
                    新建
                  </button>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto">
                {historyConversations.value.length === 0 && (
                  <p class="text-sm text-gray-500">暂无历史对话</p>
                )}
                {historyConversations.value.map((conv) => (
                  <div
                    key={conv.id}
                    class={['p-3 mb-2 rounded cursor-pointer flex items-start justify-between', activeConversationId.value === conv.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'].join(' ')}
                    onClick={() => openConversation(conv.id)}
                  >
                    <div class="flex-1 min-w-0">
                      <div class="text-sm text-gray-800 truncate">{conv.title}</div>
                      <div class="text-xs text-gray-400 mt-1">{new Date(conv.id).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={(e: MouseEvent) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      class="ml-2 text-xs text-red-500 px-2 py-1"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 聊天区 */}
            <div class="flex-1 flex flex-col bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200 h-full">
              <div class="flex-1 flex flex-col overflow-hidden">
                <div
                  ref={messagesContainer}
                  class="flex-1 overflow-y-auto mb-4 space-y-4 p-4"
                >
                {messages.value.map((message) => (
                  <div
                    key={message.id}
                    class={['flex items-start gap-3', message.isAI ? 'justify-start' : 'justify-end'].join(' ')}
                  >
                    {message.isAI && (
                      <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-xl">🤖</div>
                    )}
                    <div class={['max-w-md px-4 py-3 rounded-2xl', message.isAI ? 'bg-white border-2 border-gray-300' : 'bg-blue-500 text-white'].join(' ')}>
                      <p class="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    {!message.isAI && (
                      <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-xl">👤</div>
                    )}
                  </div>
                ))}
                {isLoading.value && (
                  <div class="flex items-start gap-3 justify-start">
                    <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-xl">🤖</div>
                    <div class="max-w-md px-4 py-3 rounded-2xl bg-white border-2 border-gray-300">
                      <div class="flex gap-1">
                        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div class="bg-white rounded-b-xl p-4 border-t-0">
                <div class="flex gap-2 mb-3">
                  <button
                    onClick={startGame}
                    disabled={isGameStarted.value}
                    class={['px-6 py-2 rounded-full font-medium transition-all', isGameStarted.value ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'].join(' ')}
                  >
                    开始
                  </button>
                  <button
                    onClick={endGame}
                    disabled={isGameEnded.value || !isGameStarted.value}
                    class={['px-6 py-2 rounded-full font-medium transition-all', isGameEnded.value || !isGameStarted.value ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'].join(' ')}
                  >
                    结束游戏
                  </button>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex-1 relative">
                    <input
                      type="text"
                      v-model={userInput.value}
                      onKeyPress={handleKeyPress}
                      placeholder="请输入内容"
                      disabled={isLoading.value}
                      class="w-full px-6 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-blue-400 bg-gray-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={isLoading.value || !userInput.value.trim()}
                      class={['absolute right-1 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all', isLoading.value || !userInput.value.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'].join(' ')}
                    >
                      发送
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
