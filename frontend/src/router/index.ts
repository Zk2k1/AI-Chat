import { createRouter, createWebHistory } from 'vue-router';
import StartPage from '../pages/StartPage';
import ChatRoom from '../pages/ChatRoom';

const routes = [
  {
    path: '/',
    name: 'Start',
    component: StartPage,
  },
  {
    path: '/chat/:roomId',
    name: 'Chat',
    component: ChatRoom,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
