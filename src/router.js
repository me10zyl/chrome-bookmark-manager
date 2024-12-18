import { createRouter, createWebHashHistory } from 'vue-router'
import Popup from './views/Popup.vue'
import Search from './views/Search.vue'
import BookmarkGroups from "./views/BookmarkGroups.vue";

const routes = [
  {
    path: '/',
    redirect: '/popup'
  },
  {
    path: '/search',
    name: 'Search',
    component: Search,
    meta: {
      title: 'Search'
    }
  },
  {
    path: '/popup',
    name: 'Popup',
    component: Popup,
    meta: {
      title: 'Popup'
    }
  },
  {
    path: '/bookmarkGroups',
    name: 'BookmarkGroups',
    component: BookmarkGroups,
    meta: {
      title: '书签组管理'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Chrome 扩展'
  next()
})

export default router 