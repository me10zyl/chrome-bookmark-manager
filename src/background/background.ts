import {addToGroup, clickBtn, fetchBookmarkGroups, removeFromBookmarkGroup} from '../js/bookmarkGroup'
import {AddBookMark, BookmarkData, MessageRequest,  RemoveBookMark} from "../js/commonDeclare";

console.log('background.js running...')

const sendTabMessage = (message: MessageRequest)=>{
    return new Promise((resolve, reject)=>{
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                const activeTabId = tabs[0].id;
                chrome.tabs.sendMessage(activeTabId, message, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("消息发送失败:", chrome.runtime.lastError);
                    } else {
                        console.log("收到 content script 的回复:", response);
                    }
                    resolve(response)
                });
            }
        });
    })
}

function getBookmarkGroupName(bookmarkGroups: chrome.bookmarks.BookmarkTreeNode[], tabUrl): string[] {
    let bookmarkGroup = bookmarkGroups.find((bookmarkGroup) => {
        return bookmarkGroup.children?.find((bookmark) => {
            return bookmark.url === tabUrl
        })
    })
    if(bookmarkGroup){
        return [bookmarkGroup.title, bookmarkGroup.id]
    }
    return [null, null]
}

chrome.runtime.onInstalled.addListener(async () => {
    console.log('onInstalled')
    chrome.contextMenus.create({
        id: "showDialog",
        title: "添加/移除到书签组",
        contexts: ["page"]
    });
    chrome.runtime.onMessage.addListener(async (request: MessageRequest, sender, sendResponse) => {
        console.log("收到来自 content script 的消息:", request);
        if(request.action === 'removeFromBookmarkGroup'){
            let data = request.data as RemoveBookMark;
            let tab = await chrome.tabs.get(data.tabId)
            if(tab) {
                removeFromBookmarkGroup(tab.url)
                sendResponse({ action: request.action, message: "Removed", data: 'remove' } as MessageRequest);
            }else{
                sendResponse({ action: request.action, message: "Tab do not exist" , data: 'remove' } as MessageRequest);
            }
        }else if(request.action === 'addToBookmarkGroup'){
            const data = request.data as AddBookMark;
            addToGroup(data.bookmarkGroupName, [data.tabId.toString()])
            sendResponse({
                action: request.action,
                data: 'ok',
                message: "已成功添加到" + data.bookmarkGroupName
            } as MessageRequest)
        }
    });

    const tabs = [];

    chrome.tabs.onUpdated.addListener((tabId, removeInfo) => {
        const index = tabs.indexOf(tabId);
        if (index !== -1) {
            tabs.splice(index, 1);
            console.log(`Tab with id ${tabId} removed from tabs array.`);
        }
    });

    async function executeScript(tab: chrome.tabs.Tab) {
        //@ts-ignore
        console.log('checking tab')
        if(tabs.includes(tab.id)){
            console.log('tab already exists', tab)
            return
        }
        let value = await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ["contentScript.bundle.js"]
        });
        console.log('execute script', tab, value)
        tabs.push(tab.id)
    }

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        if (info.menuItemId === "showDialog") {
            console.log('showDialog.')
            await executeScript(tab);
            let bookmarkGroups = await fetchBookmarkGroups();
            let [bookmarkGroupName, bookmarkGroupId] = getBookmarkGroupName(bookmarkGroups, tab.url);
            await sendTabMessage({
                action: 'showDialog',
                data: {
                    bookmarkGroups: bookmarkGroups,
                    tabUrl: tab.url,
                    tabId: tab.id,
                    addOrRemove: bookmarkGroupName ? 'remove' : 'add',
                    bookmarkGroupName: bookmarkGroupName,
                    bookmarkGroupId: bookmarkGroupId
                } as BookmarkData
            })
        }
    });


    // 在你的脚本中添加以下代码
    chrome.commands.onCommand.addListener(async (command) => {
        if (command === 'open-search') {
            // 触发全局搜索的逻辑
            let tab = await clickBtn('search');
            chrome.tabs.sendMessage(tab.id, { action: 'updateSearchResults' });
        }else if(command === 'open-bookmark-group'){
            let tab = await clickBtn('bookmarkGroups');
        }
    });
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if(chrome.runtime.getURL('index.html#/search') === tab.url){
            chrome.tabs.sendMessage(tab.id, { action: 'updateSearchResults' });
        }
    })
});