import Tab = chrome.tabs.Tab;
import {useEffect, useMemo, useState} from "react";
import {groupBy} from "../js/util";
import styles from '../css/Search.module.css';
import {CONFIG, search, SearchResults, typeLabels, useDebounce} from "../js/search";
import SearchItems from "./SearchItems";
import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
import HistoryItem = chrome.history.HistoryItem;
import {MessageRequest} from "../js/commonDeclare";
import {flushSync} from "react-dom";



function SearchHead({doSearch, searchText, setSearchText}) {
    const [lastUpdated, setLastUpdated] = useState('')
    // const debounceSearch = useDebounce(doSearch, CONFIG.debounceTime);
    const handleBlur = () => {

    }

    const handleFocus = () => {

    }

    const onChangeSearchText = (e) => {
        // setSearchText(e.target.value)
        // debounceSearch()
    }
    // debounceSearch()

    return (
        <>
            <div className={styles["page-head"]}>
                <div className={styles["page-head-left"]}>
                    <h1 className={styles["page-title"]}>全局搜索</h1>
                    <button onClick={doSearch} className={styles["reload-button"]}>
                        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
                             fill="#000000"
                             height="16px" width="16px" viewBox="0 0 489.533 489.533" xmlSpace="preserve">
                            <g>
                                <path
                                    d="M268.175,488.161c98.2-11,176.9-89.5,188.1-187.7c14.7-128.4-85.1-237.7-210.2-239.1v-57.6c0-3.2-4-4.9-6.7-2.9   l-118.6,87.1c-2,1.5-2,4.4,0,5.9l118.6,87.1c2.7,2,6.7,0.2,6.7-2.9v-57.5c87.9,1.4,158.3,76.2,152.3,165.6   c-5.1,76.9-67.8,139.3-144.7,144.2c-81.5,5.2-150.8-53-163.2-130c-2.3-14.3-14.8-24.7-29.2-24.7c-17.9,0-31.9,15.9-29.1,33.6   C49.575,418.961,150.875,501.261,268.175,488.161z"/>
                            </g>
                        </svg>
                    </button>
                    <div className={styles["last-updated"]}>
                        最后更新时间: {lastUpdated}
                    </div>
                </div>
            </div>
            {/*   <Dropdown>
            <Dropdown-item onClick="closeAllGroups">
            关闭所有的分组
        </Dropdown-item>
    </Dropdown>*/}
            <div className={styles["search-wrapper"]}>
                <input type="text" id={styles.searchInput} placeholder="搜索标签页、书签、历史记录..." autoFocus
                       onChange={onChangeSearchText}
                       value={searchText} onBlur={handleBlur} onFocus={handleFocus}/>
                <div className={styles["search-icon"]}>🔍</div>
            </div>
        </>
    )
}

function SearchResultHeader({resultType, batchSelect, batchCloseSelectTabs, createBookmarkGroup, batchSelectCount}) {
    return (<div className={styles["group-header"]}>
        <span>{typeLabels[resultType]}</span>
        {resultType === 'tab' && <div className={styles["batch-select-container"]}>
            <div v-if="!showBatchSelect" className={styles["tab-stats"]}>
                {/*窗口:{{ tabStats.windowCount }} 标签页:{{ tabStats.tabCount }}*/}
            </div>
            <button onClick={batchSelect} className={styles["action-btn"]}
                    v-if="!showBatchSelect">批量选择
            </button>
            <div className={styles["batch-actions"]} v-if="showBatchSelect">
                <button id="selectAll" className={styles["action-btn"]} onClick="selectAll">全选
                </button>
                <button id="selectAll" className={styles["action-btn"]}
                        onClick={batchCloseSelectTabs}>关闭
                </button>
                <button id="createGroup" className={styles["action-btn"]}
                        onClick={createBookmarkGroup}>创建书签组
                </button>
                <span className={styles["selected-count"]}>已选择: {batchSelectCount}</span>
                <button className={styles["action-btn"]} onClick={() => setShowBatchSelect(false)}
                        id="cancelBtn">取消
                </button>
            </div>
        </div>}
    </div>)
}

function SearchResult({searchResult}: { searchResult: SearchResult }) {

    const [batchSelectCount, setBatchSelectCount] = useState(0)
    const batchSelect = () => {

    }
    const batchCloseSelectTabs = () => {

    }

    const createBookmarkGroup = () => {

    }
    return (
        <>
            {searchResult && <div className={styles["search-box"]}>
                <SearchResultHeader resultType={searchResult.type} batchSelect={batchSelect}
                                    batchSelectCount={batchSelectCount}
                                    batchCloseSelectTabs={batchCloseSelectTabs}
                                    createBookmarkGroup={createBookmarkGroup}></SearchResultHeader>
                <SearchItems searchResult={searchResult}/>
            </div>
            }
        </>
    )
}


export default function Search() {


    const [searchText, setSearchText] = useState('')
    const [searchResults, setSearchResults] = useState<SearchResults>({
        tab: {
            type: 'tab',
            results: []
        },
        history: {
            type: 'history',
            results: []
        },
        bookmark: {
            type: 'bookmark',
            results: []
        }
    })
    const [isLoading, setIsLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [lastUpdated, setLastUpdated] = useState('')

    const [groupedResults, setGroupedResults] = useState('')
    const [batchSelectCount, setBatchSelectCount] = useState(0)
    const [batchSelect, setBatchSelect] = useState(false)

    const debounceSearch = () => {
    }


    function batchCloseSelectTabs() {

    }

    function createBookmarkGroup() {

    }

    const doSearch =  () => {
        search({searchText, setSearchResults, setIsLoading, setShowResults, setLastUpdated})
    }

    const handleMessage = (message:MessageRequest) => {
        if (message.action === 'updateSearchResults') {
            doSearch();
        }
    }

    const init = ()=>{
        useEffect(()=>{
            chrome.runtime.onMessage.addListener(handleMessage);
            doSearch()
            return () => {
                chrome.runtime.onMessage.removeListener(handleMessage);
            };
        }, [])

    }

    init()



    return (
        <div className={styles["search-container"]}>
            <SearchHead doSearch={doSearch} searchText={searchText} setSearchText={setSearchText}></SearchHead>
            <div id="searchResults" className={styles["results-container"]}>
                {isLoading && <div className={styles["loading"]}>加载中...</div>}
                <SearchResult searchResult={searchResults.tab}></SearchResult>
                <SearchResult searchResult={searchResults.history}></SearchResult>
                <SearchResult searchResult={searchResults.bookmark}></SearchResult>
            </div>
        </div>
    )
}
