<script setup>
import { ref, onMounted } from 'vue'

const bookmarkGroups = ref([])
const editingGroupId = ref(null)

// 获取书签组
const fetchBookmarkGroups = async () => {
  const tree = await new Promise(resolve => {
    chrome.bookmarks.getTree(resolve)
  })
  
  const groups = []
  const traverse = (nodes) => {
    for (const node of nodes) {
      if (node.children) {
        if (node.id !== '0' && node.id !== '1' && node.id !== '2' && node.title !== '[TabGroup]') {
          groups.push(node)
        }
        traverse(node.children)
      }
    }
  }
  
  traverse(tree)
  bookmarkGroups.value = groups
}

// 更新组名
const updateGroupName = async (groupId, newTitle) => {
  try {
    await chrome.bookmarks.update(String(groupId), { title: newTitle })
    editingGroupId.value = null
    await fetchBookmarkGroups()
  } catch (error) {
    console.error('更新书签组名称失败:', error)
    alert('更新失败，请重试')
  }
}

// 删除书签组
const deleteGroup = async (groupId) => {
  if (confirm('确定要删除此书签组吗？')) {
    try {
      await chrome.bookmarks.removeTree(String(groupId))
      await fetchBookmarkGroups()
    } catch (error) {
      console.error('删除书签组失败:', error)
      alert('删除失败，请重试')
    }
  }
}

// 删除书签
const deleteBookmark = async (bookmarkId) => {
  try {
    await chrome.bookmarks.remove(String(bookmarkId))
    await fetchBookmarkGroups()
  } catch (error) {
    console.error('删除书签失败:', error)
    alert('删除失败，请重试')
  }
}

// 打开所有书签
const openAllBookmarks = (bookmarks) => {
  bookmarks.forEach(bookmark => {
    if (bookmark.url) {
      chrome.tabs.create({ url: bookmark.url, active: false })
    }
  })
}

onMounted(fetchBookmarkGroups)
</script>

<template>
  <div class="bookmark-groups">
    <div v-for="group in bookmarkGroups" 
         :key="group.id" 
         class="bookmark-folder">
      <div class="group-header">
        <div class="group-title-wrapper">
          <div class="group-info" v-show="editingGroupId !== group.id">
            <span class="group-title">{{ group.title }}</span>
            <div class="dropdown">
              <button class="edit-group-btn" title="更多操作">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
              <div class="dropdown-menu">
                <button class="dropdown-item" 
                        @click="editingGroupId = group.id">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  <span>重命名</span>
                </button>
                <button class="dropdown-item" 
                        @click="deleteGroup(group.id)">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  <span>删除</span>
                </button>
              </div>
            </div>
          </div>
          <div class="group-edit-form" v-show="editingGroupId === group.id">
            <input type="text" 
                   class="group-name-input" 
                   :value="group.title"
                   @keyup.enter="updateGroupName(group.id, $event.target.value)"
                   @keyup.esc="editingGroupId = null"
                   ref="editInput">
            <div class="edit-actions">
              <button class="save-name-btn" 
                      @click="updateGroupName(group.id, $event.target.previousElementSibling.value)">
                保存
              </button>
              <button class="cancel-edit-btn" 
                      @click="editingGroupId = null">
                取消
              </button>
            </div>
          </div>
        </div>
        <div class="group-actions">
          <button class="icon-btn open-all-btn" 
                  title="打开所有"
                  @click="openAllBookmarks(group.children)">
            📂
          </button>
        </div>
      </div>
      <div class="bookmarks-list">
        <div v-for="bookmark in group.children" 
             :key="bookmark.id"
             class="bookmark-item"
             v-if="bookmark.url">
          <div class="bookmark-content">
            <img class="bookmark-icon" :src="`chrome://favicon/${bookmark.url}`" alt="">
            <div class="bookmark-info">
              <div class="bookmark-title">{{ bookmark.title || '无标题' }}</div>
              <div class="bookmark-url">{{ bookmark.url }}</div>
            </div>
          </div>
          <div class="bookmark-actions">
            <button class="bookmark-action-btn delete-bookmark-btn" 
                    title="删除书签"
                    @click="deleteBookmark(bookmark.id)">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 保持原有的 CSS 样式不变 */
</style> 