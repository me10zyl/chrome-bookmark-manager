<template>
  <div class="container">
    <div class="header">
      <img src="/images/icon48.png" class="logo" alt="logo">
      <h1>书签管理器</h1>
    </div>
    <div class="button-group">
      <button id="openSearch" class="btn-primary" @click="clickBtn('search')">
        <span class="icon">🔍</span>
        全局搜索
      </button>
      <button id="openGroups" class="btn-secondary" @click="clickBtn('bookmarkGroups')">
        <span class="icon">📚</span>
        书签组管理
      </button>
    </div>
  </div>
</template>
<style scoped>
a {
  text-decoration: none;
  color: inherit;
}

.container {
  width: 360px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.logo {
  width: 36px;
  height: 36px;
  margin-right: 16px;
}

h1 {
  margin: 0;
  font-size: 20px;
  color: #333;
  font-weight: 500;
}

.btn-primary {
  padding: 14px 24px;
  font-size: 15px;
}

.icon {
  margin-right: 12px;
  font-size: 18px;
}

button {
  margin: 10px 0;
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary, .btn-secondary {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-primary {
  background: #4285f4;
  color: white;
}

.btn-primary:hover {
  background: #3367d6;
}

.btn-secondary {
  background: #f8f9fa;
  color: #3c4043;
  border: 1px solid #dadce0;
}

.btn-secondary:hover {
  background: #f1f3f4;
  border-color: #d2d5d9;
}

.btn-primary:active, .btn-secondary:active {
  transform: scale(0.98);
}
</style>
<script setup lang="ts">
import {clickBtn} from "@/js/bookmarkGroup";

const openSideBar = async (id: string) => {
  let url = `index.html#/${id}`;
  let tabs = await chrome.tabs.query({
    active: true
  });
  if(tabs.length > 0) {
    console.log('tabs', tabs)
    tabs.sort((a,b)=>{
      return b.lastAccessed - a.lastAccessed
    })
    console.log('set sidebar opts')
    console.log('activeTab', tabs[0])
    let opts = await chrome.sidePanel.getOptions({
      tabId: tabs[0].id
    });
    if(!opts.enabled) {
      await chrome.sidePanel.setOptions({
        path: url,
        enabled: true,
        tabId: tabs[0].id
      })
      await chrome.sidePanel.open({tabId: tabs[0].id})
      console.log('open sidebar')
    }else{
      console.log('close sidebar')
      await chrome.sidePanel.setOptions({
        enabled: false,
        tabId: tabs[0].id
      })
    }


  }
}

</script>