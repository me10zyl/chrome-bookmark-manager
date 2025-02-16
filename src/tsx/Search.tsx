import Tab = chrome.tabs.Tab;
import {useEffect, useMemo, useRef, useState} from "react";
import {groupBy} from "../js/util";
import styles from '../css/Search.module.css';
import {CONFIG, Result, search, SearchResults, typeLabels, useDebounce} from "../js/search";
import SearchItems from "./SearchItems";
import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
import HistoryItem = chrome.history.HistoryItem;
import {MessageRequest} from "../js/commonDeclare";
import {flushSync} from "react-dom";
import {useImmer} from "use-immer";
import {addToGroup} from "../js/bookmarkGroup";



function SearchHead({doSearch, searchText, setSearchText, lastUpdated}) {


    const handleBlur = () => {

    }

    const handleFocus = () => {

    }

    const onChangeSearchText = (e) => {
        setSearchText(e.target.value)
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

function SearchResultHeader({searchResult,  showBatchSelect, setShowBatchSelect, setSearchResults}) {
    const resultType = searchResult.type;
    const clickBatchSelect = () => {
        setShowBatchSelect(!showBatchSelect)
        setSearchResults(sr=>{
            sr.tab.results.forEach(e => {
                if (e.type === 'tab') {
                    e.checked = false
                }
            })
        })
    }
    const batchSelectCount = useMemo(() => {
        return searchResult.results.filter(e => e.type === 'tab' && e.checked).length
    }, [searchResult])
    const batchCloseTabs = (tabs: Tab[] | Result[]) => {
        try {
            if(tabs.some(e=>e.groupId > 0)){
                if(!confirm(`该标签页有分组，确认删除？`)){
                    return
                }
            }
            tabs.forEach(e => {
                chrome.tabs.remove(e.id)
            })
            // 从搜索结果中移除已关闭的标签
            setSearchResults(sr=>{
                sr.tab.results =  searchResult.results.filter(result =>
                    !(result.type === 'tab' && tabs.map(e=>e.id).indexOf(result.id)!=-1)
                )
            })
        } catch (error) {
            console.error('关闭标签页失败:', error)
            alert('关闭失败，请重试')
        }
    }
    const clickBatchCloseSelectTabs = ()=>{
        batchCloseTabs(searchResult.results.filter(e => e.type === 'tab' && e.checked))
    }
    const clickCreateBookmarkGroup = ()=>{

        if (batchSelectCount.value === 0) {
            alert('请先选择标签页');
            return;
        }

        const groupName = prompt('请输入书签组名称：');
        if (!groupName) return;
        const selectedTabs: string[] = searchResult.results.filter(e => e.checked).map(e => e.id.toString())
        addToGroup(groupName, selectedTabs, ()=>{
            alert('书签组创建成功！');
            document.getElementById('cancelBtn').click();
        });
    }
    const clickSelectAll = ()=>{
        setSearchResults((sr)=>{
            for (let result of sr.tab.results) {
                result.checked = !result.checked
            }
        })


    }
    return (<div className={styles["group-header"]}>
        <span>{typeLabels[resultType]}</span>
        {resultType === 'tab' && <div className={styles["batch-select-container"]}>
            {!showBatchSelect &&
            <><div v-if="!showBatchSelect" className={styles["tab-stats"]}>
                {/*窗口:{{ tabStats.windowCount }} 标签页:{{ tabStats.tabCount }}*/}
            </div>
                <button onClick={clickBatchSelect} className={styles["action-btn"]}
                        >批量选择</button></>}
            {showBatchSelect &&
            <div className={styles["batch-actions"]} v-if="">
                <button id="selectAll" className={styles["action-btn"]} onClick={clickSelectAll}>全选
                </button>
                <button id="selectAll" className={styles["action-btn"]}
                        onClick={clickBatchCloseSelectTabs}>关闭
                </button>
                <button id="createGroup" className={styles["action-btn"]}
                        onClick={clickCreateBookmarkGroup}>创建书签组
                </button>
                <span className={styles["selected-count"]}>已选择: {batchSelectCount}</span>
                <button className={styles["action-btn"]} onClick={() => setShowBatchSelect(false)}
                        id="cancelBtn">取消
                </button>
            </div>
            }

        </div>}
    </div>)
}

function SearchResult({searchResult, isLoading, setSearchResults}: { searchResult: SearchResult ,isLoading:boolean}) {

    const [showBatchSelect, setShowBatchSelect] = useState(false)
    return (
        <>
            {searchResult && <div className={styles["search-box"]}>
                <SearchResultHeader searchResult={searchResult} setShowBatchSelect={setShowBatchSelect} showBatchSelect={showBatchSelect} setSearchResults={setSearchResults}>
                </SearchResultHeader>
                {isLoading && <div className={styles["loading"]}>加载中...</div>}
                <SearchItems searchResult={searchResult} showBatchSelect={showBatchSelect} setSearchResults={setSearchResults}/>
            </div>
            }
        </>
    )
}


export default function Search() {


    const [searchText, setSearchText] = useState('')
    const [searchResults, setSearchResults] = useImmer<SearchResults>({
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
            return () => {
                chrome.runtime.onMessage.removeListener(handleMessage);
            };
        }, [])
        const timeoutId = useRef<number|undefined>(undefined)
        useEffect(() => {
            clearTimeout(timeoutId.current)
            timeoutId.current = setTimeout(doSearch, CONFIG.debounceTime)
            return ()=>{
                clearTimeout(timeoutId.current)
            }
        }, [searchText]);
    }

    init()



    return (
        <div className={styles["search-container"]}>
            <SearchHead doSearch={doSearch} searchText={searchText} setSearchText={setSearchText} lastUpdated={lastUpdated}></SearchHead>
            <div id="searchResults" className={styles["results-container"]}>
                <SearchResult searchResult={searchResults.tab} isLoading={isLoading} setSearchResults={setSearchResults}></SearchResult>
                <SearchResult searchResult={searchResults.history} isLoading={isLoading} setSearchResults={setSearchResults}></SearchResult>
                <SearchResult searchResult={searchResults.bookmark} isLoading={isLoading} setSearchResults={setSearchResults}></SearchResult>
            </div>
        </div>
    )
}
