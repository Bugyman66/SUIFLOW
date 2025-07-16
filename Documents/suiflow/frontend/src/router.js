import { createRouter, createWebHistory } from 'vue-router';
import PayPage from './views/PayPage.vue';

const routes = [
  { path: '/', component: PayPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
