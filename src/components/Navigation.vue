<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref(router.currentRoute.value.path)

const navigateTo = (path) => {
  activeTab.value = path
  router.push(path)
}
</script>

<template>
  <nav class="navigation">
    <div class="nav-items">
      <button 
        class="nav-item" 
        :class="{ active: activeTab === '/bookmarks' }"
        @click="navigateTo('/bookmarks')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
        </svg>
        <span>书签管理</span>
      </button>
      <button 
        class="nav-item" 
        :class="{ active: activeTab === '/tabs' }"
        @click="navigateTo('/tabs')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
        </svg>
        <span>标签组管理</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navigation {
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 8px 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-items {
  display: flex;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #5f6368;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #f8f9fa;
}

.nav-item.active {
  background: #e8f0fe;
  color: #1a73e8;
}

.nav-item.active svg {
  fill: #1a73e8;
}

.nav-item svg {
  fill: #5f6368;
}

.nav-item span {
  font-size: 14px;
  font-weight: 500;
}
</style> 