import { createRouter, createWebHistory } from 'vue-router';
import VietnameseView from '../views/VietnameseView.vue';
import LanguageView from '../views/LanguageView.vue';

const routes = [
  {
    path: '/',
    name: 'vietnamese',
    component: VietnameseView,
    meta: { lang: 'vi' },
  },
  {
    path: '/en',
    name: 'english',
    component: LanguageView,
    meta: { lang: 'en' },
    props: { lang: 'en' },
  },
  {
    path: '/id',
    name: 'indonesian',
    component: LanguageView,
    meta: { lang: 'id' },
    props: { lang: 'id' },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
