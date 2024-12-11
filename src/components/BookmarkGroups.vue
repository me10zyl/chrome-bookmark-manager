<script setup lang="ts">
import { ref, onMounted , onUnmounted} from 'vue'
import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

const bookmarkGroups = ref<BookmarkTreeNode[]>([])
const editingGroupId = ref(null)

// 获取书签组
const PREFIX = '[TabGroup]';
const fetchBookmarkGroups = async () => {
  // const tree = await new Promise(resolve => {
  //   chrome.bookmarks.getTree(resolve)
  // })
  //
  // const groups = []
  // const traverse = (nodes) => {
  //   for (const node of nodes) {
  //     if (node.children) {
  //       if (node.id !== '0' && node.id !== '1' && node.id !== '2' && node.title.includes('[TabGroup]')) {
  //         groups.push(node)
  //       }
  //       traverse(node.children)
  //     }
  //   }
  // }
  //
  // traverse(tree)
  // bookmarkGroups.value = groups
  bookmarkGroups.value = await new Promise((r)=>{
    chrome.bookmarks.search({title: '我的标签组'}, function(results) {
      if (results.length === 0) {
        return;
      }

      chrome.bookmarks.getChildren(results[0].id, function(children) {
        const bookmarkGroups = children.filter(child =>
            child.title.startsWith(PREFIX)
        ).map(group => {
          group.displayTitle = group.title.replace(PREFIX, '');
          return group;
        });

        Promise.all(bookmarkGroups.map(group =>
            new Promise(resolve => {
              chrome.bookmarks.getChildren(group.id, children => {
                group.children = children;
                resolve(group);
              });
            })
        )).then(groups => {
            r(groups)
        });
      });
    });
  })

  console.log('bookmarkGroups', bookmarkGroups)
}

// 更新组名
const updateGroupName = async (groupId, newTitle) => {
  try {
    newTitle = PREFIX + newTitle;
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

const closeAllDropdowns = () => {
  bookmarkGroups.value.forEach(group => {
    group.showDropdown = false
  })
}

const handleDocumentClick = (event) => {
  if (!event.target.closest('.dropdown')) {
    closeAllDropdowns()
  }
}


onMounted(()=>{
    fetchBookmarkGroups()
    document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div class="bookmark-groups">
    <div v-for="group in bookmarkGroups"
         :key="group.id"
         class="bookmark-folder">
      <div class="group-header">
        <div class="group-title-wrapper">
          <div class="group-info" v-show="editingGroupId !== group.id">
            <span class="group-title">{{ group.displayTitle }}</span>
            <div class="dropdown">
              <button class="edit-group-btn" title="更多操作" @click="group.showDropdown = !group.showDropdown">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
              <div :class="{'dropdown-menu': true, show: group.showDropdown}">
                <button class="dropdown-item"
                        @click="closeAllDropdowns(); editingGroupId = group.id">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  <span>重命名</span>
                </button>
                <button class="dropdown-item"
                        @click="closeAllDropdowns(); deleteGroup(group.id)">
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
                   :value="group.displayTitle"
                   @keyup.enter="updateGroupName(group.id, $event.target.value)"
                   @keyup.esc="editingGroupId = null"
                   ref="editInput">
            <div class="edit-actions">
              <button class="save-name-btn action-btn"
                      @click="updateGroupName(group.id, $event.target.parentElement.previousElementSibling.value)">
                保存
              </button>
              <button class="cancel-edit-btn action-btn"
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
             >
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
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"  fill="#e10a1d"/>
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
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  margin: 0;
  padding: 20px;
  background: #f5f5f5;
}

.group-edit-form{
  display: flex;
  column-gap: 10px;
}

.edit-actions{
  display: flex;
  column-gap: 10px;
}

.delete-bookmark-btn{
  background: #fff;
  padding: 5px 16px 5px 16px;
  border-radius: 4px;
  border: 1px solid #dadce0;
  cursor: pointer;
  color: #e10a1d;
}

.group-edit-form input{
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 6px;
  padding: 5px 40px 5px 16px;
  border-radius: 8px;
  box-sizing: border-box;
  outline: none;
  border: none;
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

.container {
  max-width: 800px;
  margin: 0 auto;
}

.group-info{
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 1;
}

.group-item {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.group-title-wrapper {
  display: flex;
}

.group-title-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-title {
  font-size: 16px;
  font-weight: 500;
  color: #202124;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-actions {
  display: flex;
  gap: 8px;
}

.open-all-btn {
  background: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.open-all-btn:hover {
  background: #3367d6;
}

.delete-group-btn {
  background: white;
  color: #dc3545;
  border: 1px solid #dc3545;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.delete-group-btn:hover {
  background: #dc3545;
  color: white;
}

.bookmarks-list {
  padding: 16px;
}

.bookmark-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
  display: flex;
  justify-content: space-between;
}

.bookmark-item:last-child {
  border-bottom: none;
}

.bookmark-item:hover {
  background-color: #f8f9fa;
}

.bookmark-item a {
  display: flex;
  flex-direction: column;
  color: #3c4043;
  text-decoration: none;
  gap: 4px;
}

.bookmark-title {
  font-size: 14px;
  color: #202124;
}

.bookmark-url {
  font-size: 12px;
  color: #5f6368;
}

.folder-name {
  font-size: 14px;
  color: #5f6368;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #5f6368;
}

.empty-state p {
  margin: 8px 0;
}

.empty-hint {
  font-size: 14px;
  color: #80868b;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.edit-group-btn {
  background: transparent;
  color: rgb(247, 241, 241);
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

/* 下拉菜单相关样式 */
.dropdown {
  position: relative;
  display: inline-flex;
  margin-left: 8px;
  flex-shrink: 0;
  align-items: center;
}


.group-title-container:hover .edit-group-btn {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.05);
}

.edit-group-btn:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.edit-group-btn svg {
  fill: #444;
  width: 18px;
  height: 18px;
  transition: fill 0.2s ease;
}

.edit-group-btn:hover svg {
  fill: #1a73e8;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 180px;
  padding: 8px 0;
  margin-top: 4px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.12);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s ease;
  z-index: 1000;
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  color: #202124;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item svg {
  width: 16px;
  height: 16px;
  margin-right: 12px;
  fill: #5f6368;
}

.dropdown-item:hover svg {
  fill: #1a73e8;
}

/* 书签组样式 */
.bookmark-folder {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.group-title-wrapper {
  flex: 1;
  min-width: 0;
}

.group-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}


.group-title {
  font-size: 16px;
  font-weight: 500;
  color: #202124;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style> 