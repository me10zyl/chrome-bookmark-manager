<template>
<div class="search-container">
    <h1 class="page-title">全局搜索</h1>
    <div class="search-box">
        <input type="text" id="searchInput" placeholder="搜索标签页、书签、历史记录..." autofocus>
        <div class="search-icon">🔍</div>
    </div>
    <div id="searchStats" class="search-stats"></div>
    <div id="searchResults" class="results-container"></div>
</div>
</template>
<style>
body {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  min-width: 600px;
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
}

.search-box {
  position: relative;
  margin-bottom: 20px;
}

#searchInput {
  width: 100%;
  padding: 12px 40px 12px 16px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  outline: none;
  box-sizing: border-box;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #5f6368;
}

.results-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  max-height: 500px;
  overflow-y: auto;
}

.result-group {
  border-bottom: 1px solid #eee;
}

.result-group:last-child {
  border-bottom: none;
}

.group-header {
  padding: 12px 16px;
  background: #f8f9fa;
  font-weight: 500;
  color: #202124;
  font-size: 14px;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.result-item:hover {
  background: #f8f9fa;
}

.result-icon {
  margin-right: 12px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  color: #202124;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-url {
  font-size: 12px;
  color: #5f6368;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #5f6368;
}

.result-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
  flex-shrink: 0;
}

.type-tab {
  background: #e8f0fe;
  color: #1a73e8;
}

.type-bookmark {
  background: #fce8e6;
  color: #d93025;
}

.type-history {
  background: #e6f4ea;
  color: #137333;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #5f6368;
}

.error {
  padding: 20px;
  text-align: center;
  color: #d93025;
}

/* 默认内容样式 */
.default-content {
  padding: 20px;
}

.quick-actions {
  margin-bottom: 30px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-card:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.action-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.action-title {
  font-size: 14px;
  color: #202124;
}

.section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 18px;
  color: #202124;
  margin: 0;
}

.section-count {
  font-size: 14px;
  color: #5f6368;
}

.section-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.card-favicon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.card-title {
  font-size: 14px;
  color: #202124;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-url {
  font-size: 12px;
  color: #5f6368;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  font-size: 12px;
  color: #5f6368;
  margin-bottom: 8px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.card-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.switch-btn, .open-btn {
  background: #e8f0fe;
  color: #1a73e8;
}

.switch-btn:hover, .open-btn:hover {
  background: #d2e3fc;
}

.close-btn, .delete-btn {
  background: #fce8e6;
  color: #d93025;
}

.close-btn:hover, .delete-btn:hover {
  background: #fad2cf;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 40px;
  color: #5f6368;
}

/* 错误状态 */
.error {
  text-align: center;
  padding: 40px;
  color: #d93025;
}
</style>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchText = ref('')
const searchResults = ref([])
const isLoading = ref(false)
const showResults = ref(false)

// 计算属性：搜索结果分组
const groupedResults = computed(() => {
  const groups = {
    bookmarks: [],
    tabs: []
  }
  
  searchResults.value.forEach(item => {
    if (item.type === 'bookmark') {
      groups.bookmarks.push(item)
    } else if (item.type === 'tab') {
      groups.tabs.push(item)
    }
  })
  
  return groups
})

// 搜索函数
const search = async () => {
  if (!searchText.value.trim()) {
    searchResults.value = []
    showResults.value = false
    return
  }

  isLoading.value = true
  const query = searchText.value.toLowerCase()
  const results = []

  try {
    // 搜索书签
    const bookmarkResults = await new Promise((resolve) => {
      chrome.bookmarks.search(query, (items) => {
        resolve(items.map(item => ({
          id: item.id,
          title: item.title,
          url: item.url,
          type: 'bookmark',
          favicon: item.url ? `chrome://favicon/${item.url}` : null
        })))
      })
    })
    results.push(...bookmarkResults)

    // 搜索标签页
    const tabs = await chrome.tabs.query({})
    const tabResults = tabs
      .filter(tab => 
        tab.title.toLowerCase().includes(query) || 
        tab.url.toLowerCase().includes(query)
      )
      .map(tab => ({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        type: 'tab',
        favicon: tab.favIconUrl,
        groupId: tab.groupId
      }))
    results.push(...tabResults)

    searchResults.value = results
    showResults.value = true
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 处理搜索结果点击
const handleResultClick = async (result) => {
  if (result.type === 'bookmark') {
    // 打开书签
    chrome.tabs.create({ url: result.url })
  } else if (result.type === 'tab') {
    // 切换到对应标签页
    chrome.tabs.update(result.id, { active: true })
    chrome.windows.update(result.windowId, { focused: true })
  }
  // 清空搜索
  clearSearch()
}

// 清空搜索
const clearSearch = () => {
  searchText.value = ''
  searchResults.value = []
  showResults.value = false
}

// 处理搜索框失焦
const handleBlur = () => {
  // 使用 setTimeout 确保点击结果项能够触发
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

// 处理搜索框聚焦
const handleFocus = () => {
  if (searchResults.value.length > 0) {
    showResults.value = true
  }
}
</script>

