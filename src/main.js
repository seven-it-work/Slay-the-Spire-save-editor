import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import Clipboard from 'v-clipboard'


const app = createApp(App);

app.use(ElementPlus);
app.use(Clipboard);

app.mount('#app');
