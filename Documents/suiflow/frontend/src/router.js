import { createRouter, createWebHistory } from 'vue-router';
import PayPage from './views/PayPage.vue';
import AdminDashboard from './views/AdminDashboard.vue';

const routes = [
  { path: '/', component: PayPage },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard
  },
  {
    path: '/pay/:productId',
    name: 'PayPage',
    component: PayPage,
    props: true
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
