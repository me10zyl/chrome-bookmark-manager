// 格式化时间差

import Tab = chrome.tabs.Tab;
import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
import HistoryItem = chrome.history.HistoryItem;
import {h, ref} from "vue";
import {useCallback, useEffect, useRef} from "react";

export interface Result {
    id: number|string|undefined,
    title: string|undefined,
    url: string|undefined,
    type: 'bookmark' | 'tab' | 'history',
    favicon: string|undefined,
    checked?: boolean,
    windowId?: number,
    windowTitle?: string,
    lastAccessed?: number,
    lastVisitTime?: number,
    status?: string,
    origin?: Tab,
    groupId?:number,
    groupTitle?:string
}

export interface SearchResult {
    type: 'bookmark' | 'tab' | 'history',
    results: Result[]
}

export interface SearchResults {
    tab: SearchResult,
    history: SearchResult,
    bookmark: SearchResult
}

export const CONFIG = {
    maxResults: {
        tabs: 20,        // 默认显示5个最近的标签页
        bookmarks: 12,   // 默认显示5个最近的书签
        history: 12      // 默认显示5个最近的历史记录
    },
    minQueryLength: 2,
    debounceTime: 200
};

export const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return '未知时间';
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 60) return `${seconds} 秒前`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
    return `${Math.floor(seconds / 86400)} 天前`;
}

export const typeLabels = {
    tab: '标签页',
    bookmark: '书签',
    history: '历史'
};



export const search = async ({
    searchText,
    setSearchResults,
    setShowResults,
    setIsLoading,
    setLastUpdated
}: {
    searchText: string,
    setSearchResults: (results: SearchResults) => void,
    setShowResults: (showResults: boolean) => void,
    setIsLoading: (isLoading: boolean) => void,
    setLastUpdated: (lastUpdated: string) => void
}) => {

    console.log('开始搜索:', searchText)
    setShowResults(false)
    setIsLoading(true)
    if (!searchText.trim()) {
        await showDefaultContent()
        return
    }

    async function showDefaultContent() {
        console.log('显示默认值')
        setIsLoading(true)
        setShowResults(false)
        const [recentTabs, recentBookmarks, recentHistory] = await Promise.all([
            getRecentTabs(),
            getRecentBookmarks(),
            getRecentHistory()
        ]);
        setIsLoading(false)
        setSearchResults({
            tab: {
                type: 'tab',
                results: recentTabs
            }, bookmark: {
                type: 'bookmark',
                results: recentBookmarks
            }, history: {
                type: 'history',
                results: recentHistory
            }
        })
        setShowResults(true)
        setLastUpdated(new Date().toLocaleString())
    }


// 获取最近的标签页
    function getRecentTabs(): Promise<Result[]> {
        return new Promise((resolve) => {
            chrome.tabs.query({}, (tabs: Tab[]) => {
                sortTab(tabs.map(mapTab)).then(results1 => {
                    resolve(results1);
                });
            });
        });
    }

// 获取最近的书签
    function getRecentBookmarks(): Promise<Result[]> {
        return new Promise((resolve) => {
            chrome.bookmarks.getRecent(CONFIG.maxResults.bookmarks, (bookmarks) => {
                resolve(bookmarks.map(mapBookmarks));
            });
        });
    }

    function sortHistory(historyList: Result[]) {
        historyList.sort((a, b) => {
            if(!a.lastAccessed || !b.lastAccessed){
                return 0;
            }
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
    function getRecentHistory(): Promise<Result[]> {
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
    function mapBookmarks(item: BookmarkTreeNode): Result {
        return {
            id: item.id,
            title: item.title,
            url: item.url,
            type: 'bookmark',
            favicon: item.url ? `chrome://favicon/${item.url}` : undefined
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
            favicon: his.url ? `chrome://favicon/${his.url}` : undefined,
            lastVisitTime: his.lastVisitTime
        }
    }

    async function sortTab(tabResults: Result[]) {
        if (tabResults.length > 0) {
            tabResults.sort((a, b) => {
                if(a.lastAccessed === undefined || b.lastAccessed === undefined){
                    return 0;
                }
                return b.lastAccessed - a.lastAccessed;
            });
            for (let tab of tabResults) {
                if (tab.groupId && tab.groupId > 0) {
                    console.log(tab.groupId)
                    let tabGroup = await chrome.tabGroups.get(tab.groupId);
                    tab.groupTitle = tabGroup.title
                }
            }
        }
        return tabResults
    }

   async function getSearchResults(){
       const query = searchText.toLowerCase()
       const results: SearchResults = {
           tab: {
               type: 'tab',
               results: []
           }, bookmark: {
               type: 'bookmark',
               results: []
           }, history: {
               type: 'history',
               results: []
           }
       }

       try {
           // 搜索书签
           const bookmarkResults: Result[] = await new Promise((resolve) => {
               chrome.bookmarks.search(query, (items) => {
                   resolve(items.slice(0, CONFIG.maxResults.bookmarks).map(mapBookmarks))
               })
           })
           results.bookmark.results = bookmarkResults

           // 搜索标签页
           const tabs = await chrome.tabs.query({})

           const tabResults = tabs
               .filter(tab =>{
                    return (tab.title && tab.title.toLowerCase().includes(query)) ||
                        (tab.url && tab.url.toLowerCase().includes(query))
                   }
               )
               .map(mapTab)
           await sortTab(tabResults)
           results.tab.results = tabResults

           const historyResults: Result[] = await new Promise((resolve) => {
               chrome.history.search({
                   text: query,
                   startTime: 0
               }, (history) => {
                   resolve(sortHistory(history.map(mapHistory)));
               });
           });
           results.history.results = historyResults

           setSearchResults(results)
           setShowResults(true)
           setLastUpdated(new Date().toLocaleString())
       } catch (error) {
           console.error('搜索失败:', error)
       } finally {
           setIsLoading(false)
       }
   }

    await getSearchResults()
}
// 方案一：通用防抖 Hook
export function useDebounce<T extends (...args: any[]) => void>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<number>(null);

    // 清除定时器
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    ) as T;
}