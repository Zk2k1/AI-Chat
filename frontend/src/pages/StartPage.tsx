import { useRouter } from 'vue-router';

export default {
  name: 'StartPage',
  setup() {
    const router = useRouter();

    const startGame = () => {
      const roomId = Math.floor(Math.random() * 1000000);
      router.push(`/chat/${roomId}`);
    };

    return () => (
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full text-center border-4 border-gray-800">
          <h1 class="text-5xl font-bold text-gray-800 mb-8">
            🧩
          </h1>
          <h2 class="text-4xl font-bold text-gray-800 mb-16">
            AI 脑筋急转弯
          </h2>
          <button
            onClick={startGame}
            class="w-full max-w-sm mx-auto px-12 py-4 text-xl font-medium text-gray-800 bg-white border-4 border-gray-800 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            开始游戏
          </button>
        </div>
      </div>
    );
  },
};
