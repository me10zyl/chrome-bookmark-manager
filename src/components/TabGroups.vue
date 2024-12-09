<script setup>
import { ref, onMounted } from 'vue'

const tabGroups = ref([])
const bookmarkFolders = ref([])
const showingDropdownId = ref(null)

// 获取标签组
const fetchTabGroups = async () => {
  const groups = await chrome.tabGroups.query({})
  for (const group of groups) {
    const tabs = await chrome.tabs.query({ groupId: group.id })
    group.tabs = tabs
  }
  tabGroups.value = groups
}

// 获取书签文件夹
const fetchBookmarkFolders = async () => {
  const tree = await new Promise(resolve => {
    chrome.bookmarks.getTree(resolve)
  })
  
  const folders = []
  const traverse = (nodes) => {
    for (const node of nodes) {
      if (node.children) {
        if (node.id !== '0' && node.id !== '1' && node.id !== '2') {
          folders.push({
            id: node.id,
            title: node.title
          })
        }
        traverse(node.children)
      }
    }
  }
  
  traverse(tree)
  bookmarkFolders.value = folders
}

// 添加到书签组
const addToBookmarkFolder = async (folderId, tabs) => {
  try {
    for (const tab of tabs) {
      await chrome.bookmarks.create({
        parentId: folderId,
        title: tab.title,
        url: tab.url
      })
    }
    alert('添加成功！')
    showingDropdownId.value = null
  } catch (error) {
    console.error('添加到书签组失败:', error)
    alert('添加失败，请重试')
  }
}

onMounted(async () => {
  await fetchTabGroups()
  await fetchBookmarkFolders()
})
</script>

<template>
  <div class="tab-groups">
    <div v-for="group in tabGroups" 
         :key="group.id" 
         class="tab-group">
      <div class="group-header">
        <div class="group-title-wrapper">
          <span class="group-title">{{ group.title }}</span>
          <div class="group-actions">
            <button class="action-btn add-to-bookmark-btn"
                    title="添加到书签组"
                    @click="showingDropdownId = group.id">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/>
              </svg>
            </button>
            <div class="bookmark-folders-dropdown" 
                 :class="{ show: showingDropdownId === group.id }">
              <div class="dropdown-content">
                <div class="dropdown-header">选择书签组</div>
                <div class="folders-list">
                  <div v-for="folder in bookmarkFolders"
                       :key="folder.id"
                       class="folder-item"
                       @click="addToBookmarkFolder(folder.id, group.tabs)">
                    <svg viewBox="0 0 24 24">
                      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                    </svg>
                    <span>{{ folder.title }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="tabs-list">
        <div v-for="tab in group.tabs" 
             :key="tab.id"
             class="tab-item">
          <img class="tab-favicon" :src="tab.favIconUrl" alt="">
          <span class="tab-title">{{ tab.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 保持原有的 CSS 样式不变 */
</style> 