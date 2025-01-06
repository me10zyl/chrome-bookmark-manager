import {fetchBookmarkGroups} from '../js/bookmarkGroup'
import {MessageRequest} from "../js/commonDeclare";

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

chrome.runtime.onInstalled.addListener(async () => {
    console.log('onInstalled')
    chrome.contextMenus.create({
        id: "addToBookmarkGroup",
        title: "添加到书签组",
        contexts: ["page"]
    });

    chrome.contextMenus.create({
        id: "removeFromBookmarkGroup",
        title: "从书签组移除",
        contexts: ["page"]
    });

    chrome.runtime.onMessage.addListener(async (request: MessageRequest, sender, sendResponse) => {
        console.log("收到来自 content script 的消息:", request);
        if(request.action === 'removeFromBookmarkGroup'){
            let tabs = await chrome.tabs.query({
                active: true,
                currentWindow: true
            });
            if(tabs.length > 0){
                sendResponse({
                    action: request.action,
                    data: chrome.bookmarks.search({url: tabs[0].url})
                } as MessageRequest)
            }
        }
        sendResponse({ message: "Hello from background" });
    });

    async function executeScript(tab: chrome.tabs.Tab) {
        //@ts-ignore
        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ["contentScript.bundle.js"]
        });
    }

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        if (info.menuItemId === "addToBookmarkGroup") {
            await executeScript(tab);
            await sendTabMessage({
                action: 'addToBookmarkGroup',
                data: {
                    bookmarkGroups: fetchBookmarkGroups(),
                    tabUrl: tab.url
                }
            })
        } else if (info.menuItemId === "removeFromBookmarkGroup") {
            await executeScript(tab);
            await sendTabMessage({
                action: 'removeFromBookmarkGroup',
                data: {
                    bookmarkGroups: fetchBookmarkGroups(),
                    tabUrl: tab.url
                }
            })
        }
    });
});