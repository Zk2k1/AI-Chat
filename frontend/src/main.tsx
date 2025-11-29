import { createApp } from 'vue';
import App from './App.tsx';
import router from './router';
import './index.css';

const app = createApp(App);
app.use(router);
app.mount('#root');
