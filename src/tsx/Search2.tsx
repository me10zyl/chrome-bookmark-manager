import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractDomain, groupBy, formatTimeAgo, typeLabels } from '@/js/util';
// import Dropdown from "@/components/Dropdown";
// import DropdownItem from "@/components/DropdownItem";
import { addToGroup } from "@/js/bookmarkGroup";
// import SearchItem from "@/components/SearchItem";
import styles from '../css/Search.module.css'

type Tab = chrome.tabs.Tab;
type HistoryItem = chrome.history.HistoryItem;

interface Result {
    id: string;
    title: string;
    url: string;
    type: 'bookmark' | 'tab' | 'history';
    favicon: string;
    checked?: boolean;
    windowId?: number;
    windowTitle?: string;
    lastAccessed?: number;
    lastVisitTime?: number;
    status?: string;
    origin?: Tab;
    groupTitle?: string;
    groupId?: number;
}

const CONFIG = {
    maxResults: {
        tabs: 20,
        bookmarks: 12,
        history: 12
    },
    minQueryLength: 2,
    debounceTime: 200
};

export default function SearchComponent() {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<Result[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [lastUpdated, setLastUpdated] = useState('');
    const [showBatchSelect, setShowBatchSelect] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout>();

    // 计算属性转换
    const groupedResults = useMemo(() => {
        const groupResults = groupBy(searchResults, e => e.type);
        const newObject: Record<string, Result[]> = {};
        const keys = Object.keys(groupResults).sort((a, b) =>
            a === 'tab' ? -1 : a === 'history' && b !== 'tab' ? -1 : 0
        );

        keys.forEach(key => newObject[key] = groupResults[key]);
        delete newObject['tab'];
        return newObject;
    }, [searchResults]);

    // 生命周期转换
    useEffect(() => {
        const handleMessage = (message: any) => {
            if (message.action === 'updateSearchResults') {
                search();
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        search();

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

    // 防抖处理
    const debounceSearch = useCallback((func: Function, wait: number) => {
        return (...args: any[]) => {
            clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(() => func(...args), wait);
        };
    }, []);

    // 搜索函数转换
    const search = useCallback(async () => {
        setShowResults(false);
        setIsLoading(true);

        if (!searchText.trim()) {
            await showDefaultContent();
            return;
        }

        // ...保持原有搜索逻辑，将 ref.value 改为状态更新方法
        // 例如：searchResults.value = [...] 改为 setSearchResults([...])
    }, [searchText]);

    // 事件处理函数转换
    const handleResultClick = useCallback(async (result: Result) => {
        // 保持原有逻辑
    }, []);

    // JSX 模板转换
    return (
        <div className={styles["search-container"]}>
            <div className={styles["page-head"]}>
                <div className={styles["page-head-left"]}>
                    <h1 className={styles["page-title"]}>全局搜索</h1>
                    <button onClick={search} className={styles["reload-button"]}>
                        {/* SVG 图标保持相同 */}
                    </button>
                    <div className={styles["last-updated"]}>最后更新时间: {lastUpdated}</div>
                </div>
                {/*<Dropdown>*/}
                {/*    <DropdownItem onClick={closeAllGroups}>*/}
                {/*        关闭所有的分组*/}
                {/*    </DropdownItem>*/}
                {/*</Dropdown>*/}
            </div>

            <div className={styles["search-wrapper"]}>
                <input
                    type="text"
                    value={searchText}
                    onChange={e => {
                        setSearchText(e.target.value);
                        debounceSearch(search, CONFIG.debounceTime);
                    }}
                    // ...其他属性
                />
                <div className={styles["search-icon"]}>🔍</div>
            </div>

            <div className={styles["results-container"]}>
                {isLoading && <div className={styles["loading"]}>加载中...</div>}

                {groupedTabs && (
                    <div className={styles["search-box"]}>
                        <div className={styles["group-header"]}>
                            <span>标签页</span>
                            {/* 批量选择逻辑 */}
                        </div>
                        {/*<SearchItem*/}
                        {/*    items={groupedTabs}*/}
                        {/*    onBatchCloseTabs={batchCloseTabs}*/}
                        {/*    onCloseTab={closeTab}*/}
                        {/*    onResultClick={handleResultClick}*/}
                        {/*/>*/}
                    </div>
                )}

                {Object.entries(groupedResults).map(([key, arr]) => (
                    <div className={styles["search-box"]} key={key}>
                        {/* 结果渲染 */}
                    </div>
                ))}
            </div>
        </div>
    );
}