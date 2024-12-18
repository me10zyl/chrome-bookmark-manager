<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue'
import {extractDomain} from "@/js/util";
import Dropdown from "@/components/Dropdown.vue";
import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
import Tab = chrome.tabs.Tab;
import TabGroup = chrome.tabGroups.TabGroup;
import DropdownItem from "@/components/DropdownItem.vue";

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
  bookmarkGroups.value = await new Promise((r) => {
    chrome.bookmarks.search({title: '我的标签组'}, function (results) {
      if (results.length === 0) {
        return;
      }

      chrome.bookmarks.getChildren(results[0].id, function (children) {
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
}

// 更新组名
const updateGroupName = async (groupId, newTitle) => {
  try {
    newTitle = PREFIX + newTitle;
    await chrome.bookmarks.update(String(groupId), {title: newTitle})
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

const openBookmark = async (bookmark: chrome.bookmarks.BookmarkTreeNode, winId: number, active: boolean) => {

  let tab = null;
  if (bookmark.url) {
    tab = await chrome.tabs.create({url: bookmark.url, active: active, windowId: winId});
    console.log(`创建标签成功,url=${bookmark.url},tab=`, tab)
  }
  return tab
}

// 打开所有书签
const openAllBookmarks = async (bookmarks: BookmarkTreeNode[], group: BookmarkTreeNode) => {


  async function removeUnusedTab(windowId: number) {
    let winTabs = await chrome.tabs.query({
      windowId: windowId
    });
    for (let i = winTabs.length - 1; i >= 0; i--) {
      if (winTabs[i].url === 'chrome://newtab/' || winTabs[i].pendingUrl === 'chrome://newtab/') {
        await chrome.tabs.remove(winTabs[i].id)
        console.log('删除没用的Tab', winTabs[i])
      }
    }
  }

  if (bookmarks.length == 0) {
    return
  }
  let newVar = await chrome.tabGroups.query({});
  console.log('打开书签组', group.displayTitle, newVar)

  let tabGroups: TabGroup[] = await chrome.tabGroups.query({
    title: group.displayTitle
  });
  let windowId: number = null;
  if (tabGroups.length > 0) {
    console.log('书签组Id不为空')
    let tabGroupId = tabGroups[0].id
    windowId = tabGroups[0].windowId
    console.log(`存在书签组,groupId=${tabGroupId},windowId=${windowId}`)
    await removeUnusedTab(windowId);
    let existingTabs = await chrome.tabs.query({groupId: tabGroups[0].id});
    console.log(`已存在${existingTabs.length}个标签页`, existingTabs)

    let closedBookmarks = bookmarks.filter(e => existingTabs.map(ee => extractDomain(ee.url)).indexOf(extractDomain(e.url)) == -1);
    let promises = [];
    for (let i = 0; i < closedBookmarks.length; i++) {
      promises.push(openBookmark(closedBookmarks[i], windowId, i == 0))
    }
    let newAddTabs = await Promise.all(promises);
    console.log('新增的标签页', newAddTabs)
    if(newAddTabs.length > 0) {
      await chrome.tabs.group({
        tabIds: newAddTabs.map(e => e.id),
        groupId: tabGroupId
      })
    }
    await chrome.tabs.update(existingTabs[0].id, {
      active: true
    })

  } else {
    const tabs: Tab[] = []

    windowId = (await chrome.windows.create()).id;

    console.log(`不存在书签组,windowId=${windowId}`)
    console.log('建立新窗口')
    const promises = []
    console.log('创建标签windowId=', windowId)
    for (let i = 0; i < bookmarks.length; i++) {
      promises.push(openBookmark(bookmarks[i], windowId, i == 0))
    }
    tabs.push(...await Promise.all(promises))
    await removeUnusedTab(windowId);
    console.log('书签组Id为空')
    let tabGroupId = await chrome.tabs.group({
      tabIds: [tabs.map(t => t.id)[0]],
      createProperties: {
        windowId: windowId
      }
    })
    await chrome.tabs.group({
      tabIds: [...tabs.map(t => t.id).slice(1)],
      groupId: tabGroupId
    })
    await chrome.tabGroups.update(tabGroupId, {title: group.displayTitle})
  }
  await chrome.windows.update(windowId, {focused: true})
}

onMounted(() => {
  fetchBookmarkGroups()
})

onUnmounted(() => {
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
            <Dropdown>
              <DropdownItem
                      @click="editingGroupId = group.id">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                <span>重命名</span>
              </DropdownItem>
              <DropdownItem
                      @click="deleteGroup(group.id)">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                <span>删除</span>
              </DropdownItem>
            </Dropdown>
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
                  @click="openAllBookmarks(group.children, group)">
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
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#e10a1d"/>
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

.group-edit-form {
  display: flex;
  column-gap: 10px;
}

.edit-actions {
  display: flex;
  column-gap: 10px;
}

.delete-bookmark-btn {
  background: #fff;
  padding: 5px 16px 5px 16px;
  border-radius: 4px;
  border: 1px solid #dadce0;
  cursor: pointer;
  color: #e10a1d;
}

.group-edit-form input {
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

.group-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 1;
}

.group-item {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

/* 下拉菜单相关样式 */


.edit-group-btn svg {
  fill: #444;
  width: 18px;
  height: 18px;
  transition: fill 0.2s ease;
}

.edit-group-btn:hover svg {
  fill: #1a73e8;
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