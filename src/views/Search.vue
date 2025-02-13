<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {extractDomain, groupBy} from '@/js/util'
import Dropdown from "@/components/Dropdown.vue";
import DropdownItem from "@/components/DropdownItem.vue";
import {addToGroup} from "@/js/bookmarkGroup";
import Tab = chrome.tabs.Tab;
import HistoryItem = chrome.history.HistoryItem;
import {formatTimeAgo, typeLabels} from "../js/search";
import SearchItem from "@/components/SearchItem.vue";

interface Result {
  id: string,
  title: string,
  url: string,
  type: 'bookmark' | 'tab' | 'history',
  favicon: string,
  checked?: boolean,
  windowId?: number,
  windowTitle?: string,
  lastAccessed?: number,
  lastVisitTime?: number,
  status?: string,
  origin?: Tab
}
const router = useRouter()
const searchText = ref('')
const searchResults = ref<Result[]>([])
const isLoading = ref(false)
const showResults = ref(false)
const lastUpdated = ref('')


// 搜索配置
const CONFIG = {
  maxResults: {
    tabs: 20,        // 默认显示5个最近的标签页
    bookmarks: 12,   // 默认显示5个最近的书签
    history: 12      // 默认显示5个最近的历史记录
  },
  minQueryLength: 2,
  debounceTime: 200
};

// 计算属性：搜索结果分组
const groupedResults = computed(() => {
  let groupResults = groupBy(searchResults.value, e => e.type);
  const newObject = {}
  let keys = Object.keys(groupResults);
  keys.sort((a, b) => {
    if (a === 'tab') {
      return -1;
    }
    if (a === 'history' && b !== 'tab') {
      return -1;
    }
  })
  for (let i in keys) {
    newObject[keys[i]] = groupResults[keys[i]]
  }
  delete newObject['tab']
  return newObject
})

let searchTimeout;

// 防抖函数
function debounce(func, wait) {
  return function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => func.apply(this, arguments), wait);
  };
}


// 搜索函数
const search = async () => {
  console.log('开始搜索')
  showResults.value = false
  isLoading.value = true
  if (!searchText.value.trim()) {
    await showDefaultContent()
    return
  }

  async function showDefaultContent() {
    console.log('显示默认值')
    isLoading.value = true
    showResults.value = false
    const [recentTabs, recentBookmarks, recentHistory] = await Promise.all([
      getRecentTabs(),
      getRecentBookmarks(),
      getRecentHistory()
    ]);
    isLoading.value = false
    searchResults.value = [...recentTabs, ...recentBookmarks, ...recentHistory]
    showResults.value = true
    lastUpdated.value = new Date().toLocaleString()
  }


// 获取最近的标签页
  function getRecentTabs() {
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs: Tab[]) => {
        sortTab(tabs.map(mapTab)).then(results1=>{
          resolve(results1);
        });
      });
    });
  }

// 获取最近的书签
  function getRecentBookmarks() {
    return new Promise((resolve) => {
      chrome.bookmarks.getRecent(CONFIG.maxResults.bookmarks, (bookmarks) => {
        resolve(bookmarks.map(mapBookmarks));
      });
    });
  }

  function sortHistory(historyList: Result[]) {
    historyList.sort((a, b) => {
      if (a.lastAccessed > b.lastAccessed) {
        return -1
      }
      if (a.lastAccessed < b.lastAccessed) {
        return 1
      }
      return 0
    })
    return historyList;
  }

// 获取最近的历史记录
  function getRecentHistory() {
    return new Promise((resolve) => {
      if (!chrome.history) {
        resolve([]);
        return;
      }
      chrome.history.search({
        text: '',
        maxResults: CONFIG.maxResults.history,
        startTime: 0
      }, (history) => {
        resolve(sortHistory(history.map(mapHistory)));
      });
    });
  }


  const query = searchText.value.toLowerCase()
  const results = []

  function mapBookmarks(item): Result {
    return {
      id: item.id,
      title: item.title,
      url: item.url,
      type: 'bookmark',
      favicon: item.url ? `chrome://favicon/${item.url}` : null
    }
  }

  function mapTab(tab: Tab): Result {
    return {
      id: tab.id,
      title: tab.title,
      url: tab.url,
      type: 'tab',
      favicon: tab.favIconUrl,
      groupId: tab.groupId,
      windowId: tab.windowId,
      lastAccessed: tab.lastAccessed,
      status: tab.status,
      origin: tab
    }
  }

  function mapHistory(his: HistoryItem): Result {
    return {
      id: his.id,
      title: his.title,
      url: his.url,
      type: 'history',
      favicon: his.url ? `chrome://favicon/${his.url}` : null,
      lastVisitTime: his.lastVisitTime
    }
  }


  async function sortTab(tabResults: Result[]) {
    if (tabResults.length > 0) {
      tabResults.sort((a, b) => {
        return b.lastAccessed - a.lastAccessed;
      });
      for (let tab of tabResults) {
        if(tab.groupId > 0){
          console.log(tab.groupId)
          let tabGroup = await chrome.tabGroups.get(tab.groupId);
          tab.groupTitle = tabGroup.title
        }
      }
    }
    return tabResults
  }

  try {
    // 搜索书签
    const bookmarkResults: Result[] = await new Promise((resolve) => {
      console.log('书签搜索', query)
      chrome.bookmarks.search(query, (items) => {
        resolve(items.slice(0, CONFIG.maxResults.bookmarks).map(mapBookmarks))
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
        .map(mapTab)
    await sortTab(tabResults)
    results.push(...tabResults)

    const historyResults = await new Promise((resolve) => {
      chrome.history.search({
        text: query,
        startTime: 0
      }, (history) => {
        resolve(sortHistory(history.map(mapHistory)));
      });
    });
    results.push(...historyResults)

    searchResults.value = results
    showResults.value = true
    lastUpdated.value = new Date().toLocaleString()
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    isLoading.value = false
  }
}

const debounceSearch = debounce(search, CONFIG.debounceTime);
// 处理搜索结果点击
const handleResultClick = async (result) => {
  if (result.type === 'bookmark') {
    // 打开书签
    chrome.tabs.create({url: result.url})
  } else if (result.type === 'tab') {
    // 切换到对应标签页
    chrome.tabs.update(result.id, {active: true})
    chrome.windows.update(result.windowId, {focused: true})
  } else if (result.type === 'history') {
    chrome.tabs.create({url: result.url})
  }
  // 清空搜索
  //clearSearch()
}

// 清空搜索
const clearSearch = () => {
  searchText.value = ''
  searchResults.value = []
  showResults.value = false
}


const handleBlur = () => {
  // 使用 setTimeout 确保点击结果项能够触发
  setTimeout(() => {

    if (searchResults.value.length == 0) {
      showResults.value = false
    }
  }, 200)
}

// 处理搜索框聚焦
const handleFocus = () => {
  if (searchResults.value.length > 0) {
    showResults.value = true
  }
}

const init = () => {
  search()
}


const showBatchSelect = ref<boolean>(false)
const batchSelect = () => {
  showBatchSelect.value = true;
}
const batchSelectCount = computed(() => {
  return searchResults.value.filter(e => e.checked).length
})
const selectAll = () => {
  for (let result of searchResults.value) {
    if (result.type === 'tab') {
      result.checked = !result.checked
    }
  }
}



const createBookmarkGroup = () => {

  if (batchSelectCount.value === 0) {
    alert('请先选择标签页');
    return;
  }

  const groupName = prompt('请输入书签组名称：');
  if (!groupName) return;
  const selectedTabs: string[] = searchResults.value.filter(e => e.checked).map(e => e.id.toString())
  addToGroup(groupName, selectedTabs, ()=>{
    alert('书签组创建成功！');
    document.getElementById('cancelBtn').click();
  });
}

// 关闭标签页
const closeTab = async (tab) => {
  try {
    if(tab.groupId > 0){
      if(!confirm(`该标签页有分组（${tab.groupTitle}）确认删除？`)){
        return
      }
    }
    await chrome.tabs.remove(tab.id)
    // 从搜索结果中移除已关闭的标签
    searchResults.value = searchResults.value.filter(result =>
        !(result.type === 'tab' && result.id === tab.id)
    )
    // 如果没有搜索结果了，隐藏结果框
    if (searchResults.value.length === 0) {
      showResults.value = false
    }
  } catch (error) {
    console.error('关闭标签页失败:', error)
    alert('关闭失败，请重试')
  }
}

// 按窗口和 URL 分组标签页
const groupedTabs = computed(() => {
  const groups = {}
  searchResults.value.filter(e => e.type === 'tab').forEach(tab => {
    let extraUrl = extractDomain(tab.url);
    if (!groups[extraUrl]) {
      groups[extraUrl] = []
    }
    groups[extraUrl].push(tab)
  })
  console.log(groups)
  return groups
})
const tabStats = computed(() => {
  const tabCount = searchResults.value.filter(e => e.type === 'tab').length
  return {
    windowCount: Object.keys(groupedTabs.value).length,
    tabCount: tabCount
  }
})

const batchCloseTabs = (tabs: Tab[] | Result[]) => {
  try {
    if(tabs.some(e=>e.groupId > 0)){
      if(!confirm(`该标签页有分组，确认删除？`)){
        return
      }
    }
    tabs.forEach(e => {
      chrome.tabs.remove(e.id)
    })
    // 从搜索结果中移除已关闭的标签
    searchResults.value = searchResults.value.filter(result =>
        !(result.type === 'tab' && tabs.map(e=>e.id).indexOf(result.id)!=-1)
    )
    // 如果没有搜索结果了，隐藏结果框
    if (searchResults.value.length === 0) {
      showResults.value = false
    }
  } catch (error) {
    console.error('关闭标签页失败:', error)
    alert('关闭失败，请重试')
  }
}
const batchCloseSelectTabs = () => {
  batchCloseTabs(searchResults.value.filter(e => e.type === 'tab' && e.checked))
}
const closeAllGroups = ()=>{
  (async () => {
    const groups = await chrome.tabGroups.query({});
    for (const group of groups) {
      const tabs = await chrome.tabs.query({ groupId: group.id });
      const tabIds = tabs.map(tab => tab.id);
      await chrome.tabs.remove(tabIds); // 关闭分组中的所有标签
    }
    console.log("All tab groups have been closed!");
    alert('已关闭所有分组标签')
  })();
}

// 监听来自 background.js 的消息
const handleMessage = (message) => {
  if (message.action === 'updateSearchResults') {
    search();
  }
}
init()
// 注册消息监听器
onMounted(() => {
  chrome.runtime.onMessage.addListener(handleMessage);
  // search(); // 初始加载搜索结果
});
</script>
<template>
  <div class="search-container">
    <div class="page-head">
      <div class="page-head-left">
        <h1 class="page-title">全局搜索</h1>
        <button @click="search" class="reload-button">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000" height="16px" width="16px" viewBox="0 0 489.533 489.533" xml:space="preserve">
  <g>
    <path d="M268.175,488.161c98.2-11,176.9-89.5,188.1-187.7c14.7-128.4-85.1-237.7-210.2-239.1v-57.6c0-3.2-4-4.9-6.7-2.9   l-118.6,87.1c-2,1.5-2,4.4,0,5.9l118.6,87.1c2.7,2,6.7,0.2,6.7-2.9v-57.5c87.9,1.4,158.3,76.2,152.3,165.6   c-5.1,76.9-67.8,139.3-144.7,144.2c-81.5,5.2-150.8-53-163.2-130c-2.3-14.3-14.8-24.7-29.2-24.7c-17.9,0-31.9,15.9-29.1,33.6   C49.575,418.961,150.875,501.261,268.175,488.161z"/>
  </g>
  </svg>
        </button>
        <div class="last-updated">
      最后更新时间: {{ lastUpdated }}
    </div>
      </div>
      <Dropdown>
        <Dropdown-item @click="closeAllGroups">
            关闭所有的分组
        </Dropdown-item>
      </Dropdown>
    </div>
    <div class="search-wrapper">
      <input type="text" id="searchInput" placeholder="搜索标签页、书签、历史记录..." autofocus @input="debounceSearch"
             v-model="searchText" @blur="handleBlur" @focus="handleFocus">
      <div class="search-icon">🔍</div>
    </div>
    <div id="searchResults" class="results-container">
      <div v-if="isLoading" class="loading">加载中...</div>
      <div v-if="groupedTabs" class="search-box">
        <div class="group-header">
          <span>标签页</span>
          <div class="batch-select-container">
            <div v-if="!showBatchSelect" class="tab-stats">
              窗口:{{ tabStats.windowCount }} 标签页:{{ tabStats.tabCount }}
            </div>
            <button @click="batchSelect" class="action-btn" v-if="!showBatchSelect">批量选择</button>
            <div class="batch-actions" v-if="showBatchSelect">
              <button id="selectAll" class="action-btn" @click="selectAll">全选</button>
              <button id="selectAll" class="action-btn" @click="batchCloseSelectTabs">关闭</button>
              <button id="createGroup" class="action-btn" @click="createBookmarkGroup">创建书签组</button>
              <span class="selected-count">已选择: {{ batchSelectCount }}</span>
              <button class="action-btn" @click="showBatchSelect = false" id="cancelBtn">取消</button>
            </div>
          </div>
        </div>
        <SearchItem :items="groupedTabs" @batch-close-tabs="batchCloseTabs" @close-tab="closeTab" @handle-result-click="handleResultClick"/>
<!--        <div v-for="(windowTabs, windowId) in groupedTabs" :key="windowId" class="window-group">-->
<!--          <div class="window-header">-->
<!--            <svg viewBox="0 0 24 24" width="16" height="16">-->
<!--              <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>-->
<!--            </svg>-->
<!--            <span>窗口 {{ windowId }}</span>-->
<!--          </div>-->
<!--         -->
<!--        </div>-->
      </div>
      <div v-for="(arr, key) in groupedResults" class="search-box" v-if="showResults">
        <div id="searchStats" class="search-stats"></div>
        <div class="group-container">
          <div class="group-header">
            <span>{{ typeLabels[key] }}</span>
          </div>
          <div class="result-item" v-for="item in arr">

            <img class="result-icon" v-bind:src="item.favicon">
            <div class="result-info" @click="handleResultClick(item)">
              <div class="result-title">{{ item.title }}</div>
              <div class="result-url">{{ item.url }}</div>
            </div>
            <span :class="['result-type','type-' + item.type]">{{ typeLabels[item.type] }}</span>
            <button
                class="close-tab-btn"
                title="关闭标签页"
                @click="closeTab(item)"
                v-if="item.type === 'tab'"
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>


<style>
body {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  /*min-width: 600px;*/
}
.page-head-left{
  display: flex;
  justify-content: center;
  align-items: baseline;
}

.page-head{
  display: flex;
  align-items: baseline;
  column-gap: 10px;
  justify-content: space-between;
}

.more-actions {
  background: transparent;
  color: rgb(247, 241, 241);
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.more-actions:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.more-actions svg {
  fill: #444;
  width: 18px;
  height: 18px;
  transition: fill 0.2s ease;
}

.more-actions:hover svg {
  fill: #1a73e8;
}

.reload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  cursor: pointer;

}

.reload-button:hover svg {
  fill: #01b4ff;
  transition: fill 0.2s;
}

/* 添加关闭按钮样式 */
.close-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 6px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-tab-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.tab-stats{
  color:#6e6e6e;
  font-size: 0.9em;
}

.close-tab-btn svg {
  fill: #5f6368;
}

.close-tab-btn:hover svg {
  fill: #d93025;
}

/* 添加动画效果 */
.result-item {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 添加移除动画 */
.result-item.removing {
  animation: fadeOut 0.2s ease forwards;
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.batch-actions {
  display: flex;
  column-gap: 10px;
  align-items: center;
}

.batch-select-container {
  display: flex;
  align-items: center;
  column-gap: 10px;
}


.search-container {
  margin: 0 auto;
}

.search-wrapper {
  margin-bottom: 10px;
  display: flex;
  position: relative;
}

.search-box {
  width: 0;
  flex-grow: 1;
  position: relative;
  margin-bottom: 20px;
}

#searchInput {
  width: 100%;
  padding: 12px 40px 12px 16px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  height: 82vh;
  overflow-y: auto;
  display: flex;
  /*height: 0;
  flex-direction: column;
  flex-grow: 1;*/
}

.result-group {
  border-bottom: 1px solid #eee;
}

.result-group:last-child {
  border-bottom: none;
}

.group-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  background: #f8f9fa;
  font-weight: 500;
  color: #202124;
  font-size: 14px;
  align-items: center;
  height: 32px;
  column-gap: 10px;
}

.group-header span {
  flex-shrink: 0;
}

.result-item {
  height: 40px;
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
  flex-shrink: 0;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

/* 添加新的样式 */

.action-btn {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #dadce0;
  background: white;
  cursor: pointer;
  font-size: 14px;
  color: #3c4043;
  flex-shrink: 0;
  /*  //overflow: hidden;
    //text-overflow: ellipsis;
    //white-space: nowrap;*/
}

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.add-bookmark-btn svg {
  fill: #5f6368;
}

.add-bookmark-btn:hover svg {
  fill: #1a73e8;
}

.bookmark-folders-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  z-index: 1001;
}

.dropdown-header {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #202124;
  border-bottom: 1px solid #eee;
}

.folders-list {
  max-height: 300px;
  overflow-y: auto;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.folder-item:hover {
  background-color: #f8f9fa;
}

.folder-item svg {
  fill: #5f6368;
}

.folder-item span {
  font-size: 14px;
  color: #202124;
}

/* 更新现有样式 */
.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  transition: background-color 0.2s;
}

.result-item:hover {
  background-color: #f8f9fa;
}

/* 样式更新 */
.window-group {
  margin-bottom: 16px;
}

.window-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f1f3f4;

  font-weight: bold;
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  transition: background-color 0.2s;
}

.result-item:hover {
  background-color: #f8f9fa;
}

.close-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 6px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-tab-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.close-tab-btn svg {
  fill: #5f6368;
}

.close-tab-btn:hover svg {
  fill: #d93025;
}

.last-updated {
  font-size: 12px;
  color: #5f6368;
  margin-bottom: 8px;
}

.result-time {
  font-size: 12px;
  color: #5f6368;
}
</style>