import styles from '../../css/BookmarkGroups.module.css'

import {extractDomain} from "@/js/util";

import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
import Tab = chrome.tabs.Tab;
import TabGroup = chrome.tabGroups.TabGroup;

import * as groupHandle from "@/js/bookmarkGroup";
import {useEffect, useState} from "react";
import {Dropdown, DropdownItem} from "../common/Dropdown";
import {favicon} from "../../js/util";



export default function bookmarkGroup(){
    const [bookmarkGroups, setBookmarkGroups] = useState<BookmarkTreeNode[]>([])
    const [editingGroupId, setEditingGroupId] = useState(null)

// 获取书签组

    const fetchBookmarkGroups = async () => {
        setBookmarkGroups(await groupHandle.fetchBookmarkGroups())
    }

// 更新组名
    const updateGroupName = async (groupId, newTitle) => {
        await groupHandle.updateGroupName(groupId, newTitle);
        setEditingGroupId(null)
        await fetchBookmarkGroups()
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

    const colors = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan"];


    function stringToColor(str:string) {
        // 计算哈希值
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        // 取模映射到颜色数组
        const index = Math.abs(hash) % colors.length;
        return colors[index];
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
            if(tabs.length > 1) {
                await chrome.tabs.group({
                    tabIds: [...tabs.map(t => t.id).slice(1)],
                    groupId: tabGroupId
                })
            }
            await chrome.tabGroups.update(tabGroupId, {title: group.displayTitle})
        }

        await chrome.windows.update(windowId, {focused: true})

        const tabGroups1 = await chrome.tabGroups.query({});
        console.log('tabGroups1', tabGroups1)

        tabGroups1.forEach(tabGroup => {
            console.log('tabGroup.title:', tabGroup.title, stringToColor(tabGroup.title))
            chrome.tabGroups.update(
                tabGroup.id,{
                    color : stringToColor(tabGroup.title)
                });
        })

    }


    useEffect(() => {
        fetchBookmarkGroups()
    }, []);

    const onKeyUp = (e, group)=>{
        if(e.key == 'Escape'){
            setEditingGroupId(null)
        }else if(e.key == 'Enter'){
            updateGroupName(group.id, e.target.value)
        }
    }
    return (
        <div className={styles['bookmark-groups']}>
            {bookmarkGroups.map(group => (
                <div key={group.id}
                     className={styles['bookmark-folder']}>
                    <div className={styles['group-header']}>
                        <div className={styles['group-title-wrapper']}>
                            {editingGroupId !== group.id && <div className={styles['group-info']}>
                                <span className={styles['group-title']}>{group.displayTitle}</span>
                                <Dropdown>
                                    <DropdownItem
                                        onClick={() => {
                                            setEditingGroupId(group.id)
                                        }}>
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path
                                                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                        </svg>
                                        <span>重命名</span>
                                    </DropdownItem>
                                    <DropdownItem
                                        onClick={() => {
                                            deleteGroup(group.id)
                                        }}>
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path
                                                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                        </svg>
                                        <span>删除</span>
                                    </DropdownItem>
                                </Dropdown>
                            </div>}
                            {editingGroupId === group.id && <div className={styles['group-edit-form']}>
                                <input type="text"
                                       className={styles['group-name-input']}
                                       value={group.displayTitle}
                                       onChange={(e)=>{setBookmarkGroups(r=>{
                                           let newGroups = [...r]
                                           let index = newGroups.findIndex(e=>e.id == group.id)
                                           newGroups[index].displayTitle = e.target.value
                                           return newGroups
                                       })}}
                                       onKeyUp={(e)=>{onKeyUp(e, group)}}
                                       />
                                <div className={styles['edit-actions']}>
                                    <button className={styles['save-name-btn'] + ' ' + styles['action-btn']}
                                            onClick={(e) => {
                                                updateGroupName(group.id, e.target.parentElement.previousElementSibling.value)
                                            }}>
                                        保存
                                    </button>
                                    <button className={styles['cancel-edit-btn'] + ' ' + styles['action-btn']}
                                            onClick={() => {
                                                setEditingGroupId(null)
                                            }}>
                                        取消
                                    </button>
                                </div>
                            </div>
                            }
                        </div>
                        <div className={styles['group-actions']}>
                            <button className={styles['icon-btn'] + ' ' + styles['open-all-btn']}
                                    title="打开所有"
                                    onClick={() => openAllBookmarks(group.children, group)}>📂
                            </button>
                        </div>
                    </div>
                    <div className={styles['bookmarks-list']}>
                        {group.children.map(bookmark => {
                            let bookmarkFavicon = favicon(bookmark.url);
                            return (
                                <div key={bookmark.id} className={styles['bookmark-item']}>
                                    <div className={styles['bookmark-content']}>
                                        <img className={styles['bookmark-icon']} src={bookmarkFavicon}
                                             alt=""/>
                                        <div className={styles['bookmark-info']}>
                                            <div className={styles['bookmark-title']}>{bookmark.title || '无标题'}</div>
                                            <div className={styles['bookmark-url']}>{bookmark.url}</div>
                                        </div>
                                    </div>
                                    <div className={styles['bookmark-actions']}>
                                        <button
                                            className={styles['bookmark-action-btn'] + ' ' + styles['delete-bookmark-btn']}
                                            title="删除书签"
                                            onClick={() => {
                                                deleteBookmark(bookmark.id)
                                            }}>
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path
                                                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                                                    fill="#e10a1d"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))
            }
        </div>)
} 