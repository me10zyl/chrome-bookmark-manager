import { createRouter, createWebHashHistory } from 'vue-router'
import BookmarksPage from './views/BookmarksPage.vue'
import TabsPage from './views/TabsPage.vue'
import Popup from './components/popup.vue'
import Search from './components/Search.vue'
import BookmarkGroups from "./components/BookmarkGroups.vue";

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
    path: '/bookmarks',
    name: 'Bookmarks',
    component: BookmarksPage,
    meta: {
      title: '书签管理'
    }
  },
  {
    path: '/bookmarkGroups',
    name: 'BookmarkGroups',
    component: BookmarkGroups,
    meta: {
      title: '书签组管理'
    }
  },
  {
    path: '/tabs',
    name: 'Tabs',
    component: TabsPage,
    meta: {
      title: '标签组管理'
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