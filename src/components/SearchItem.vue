<template>
  <div v-for="(urlTabs, url) in items" :key="url" class="url-group">
    <div class="url-header">
      <span>{{ url }}</span>
      <button class="url-header-close" @click="emits('batchCloseTabs', urlTabs)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="16" height="16">
          <!-- 背景矩形 -->
          <rect x="6" y="6" width="52" height="52" rx="6" fill="#E0E0E0"/>
          <!-- 第一层标签 -->
          <rect x="12" y="12" width="40" height="40" rx="4" fill="#B0BEC5"/>
          <!-- 第二层标签 -->
          <rect x="18" y="18" width="40" height="40" rx="4" fill="#90A4AE"/>
          <!-- 顶层标签 -->
          <rect x="24" y="24" width="40" height="40" rx="4" fill="#78909C"/>
          <!-- "X" 符号 -->
          <line x1="34" y1="34" x2="50" y2="50" stroke="white" stroke-width="3" stroke-linecap="round"/>
          <line x1="50" y1="34" x2="34" y2="50" stroke="white" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div v-for="tab in urlTabs" :key="tab.id" class="result-item">
      <div class="result-content">
        <input type="checkbox" class="select-checkbox" v-if="showBatchSelect" v-model="tab.checked"/>
        <img :src="tab.favicon" class="result-icon" alt="">
        <div class="result-info" @click="emits('handleResultClick',tab)">
          <div class="result-title">{{ tab.title || '无标题' }}</div>
          <div class="result-url">{{ tab.url }}</div>
          <div class="result-time">{{ formatTimeAgo(tab.lastAccessed) }}</div>
        </div>
        <span class="tab-group-title" v-if="tab.groupTitle">{{tab.groupTitle}}</span>
        <span :class="['result-type','type-tab']">{{ typeLabels['tab'] }}</span>
      </div>
      <div class="result-actions">
        <button
            class="action-btn close-tab-btn"
            title="关闭标签页"
            @click="emits('closeTab', tab)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {formatTimeAgo, typeLabels} from "../js/search";

let {items} = defineProps({
  items: {
    type: Object,
    required: true,
  },
  showBatchSelect: {
    type: Boolean,
    default: false,
  }
});

let emits = defineEmits(['closeTab', 'batchCloseTabs', 'handleResultClick']);

console.log('items', items)
</script>
<style>
body {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  /*min-width: 600px;*/
}

.tab-group-title {
  border-radius: 4px;
  background: #f4f4f4;
  border: none;
  padding: 4px 8px;
  flex-shrink: 0;
  color: #5f6368;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.select-checkbox {
  margin-right: 10px;
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

.result-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  flex-shrink: 0;
}

.type-tab {
  background: #e8f0fe;
  color: #1a73e8;
}

/* 默认内容样式 */

.section-header h2 {
  font-size: 18px;
  color: #202124;
  margin: 0;
}

/* 加载状态 */

/* 错误状态 */

/* 添加新的样式 */
.result-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.result-actions {
  display: flex;
  align-items: center;
  position: relative;
}

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

.url-group {
  margin-left: 16px;
  margin-top: 8px;
}

.url-header {
  padding: 4px 16px;
  font-size: 14px;
  color: #5f6368;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.url-header-close {
  border-radius: 2px;
  border: none;
  background: transparent;
  color: #5f6368;
}

.url-header-close:hover {
  color: #c82333;
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.05);
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

.result-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  min-width: 0;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 4px;
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

.result-time {
  font-size: 12px;
  color: #5f6368;
}
</style>