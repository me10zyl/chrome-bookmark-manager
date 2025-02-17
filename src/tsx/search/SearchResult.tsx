import {useMemo, useState} from "react";
import styles from "../../css/Search.module.css";
import SearchItems from "./SearchItems";
import {Result, ResultType, typeLabels} from "../../js/search";
import {addToGroup} from "../../js/bookmarkGroup";
import {useSearchResults, useSearchResultsDispatch} from "./SearchResultsContext";
import Tab = chrome.tabs.Tab;



interface SearchResultHeaderProps {
    searchResult: {
        type: ResultType;
        results: Result[];
    };
    showBatchSelect: boolean;
    setShowBatchSelect: (show: boolean) => void;
    hideUnmatched: boolean;
}

function SearchResultHeader({searchResult, showBatchSelect, setShowBatchSelect, hideUnmatched}: SearchResultHeaderProps) {
    const resultType = searchResult.type;
    let resultsDispatch = useSearchResultsDispatch();
    const clickBatchSelect = () => {
        setShowBatchSelect(!showBatchSelect)
        resultsDispatch({
            type: 'update',
            updateType: resultType,
            update: (searchResult) => {
                searchResult.results.forEach(e => {
                    if (e.type === 'tab') {
                        e.checked = false
                    }
                })
            }
        })
    }
    const batchSelectCount = useMemo(() => {
        return searchResult.results.filter(e => e.type === 'tab' && e.checked).length
    }, [searchResult])
    const batchCloseTabs = (tabs: Tab[] | Result[]) => {
        try {
            if (tabs.some(e => e.groupId > 0)) {
                if (!confirm(`该标签页有分组，确认删除？`)) {
                    return
                }
            }
            tabs.forEach(e => {
                chrome.tabs.remove(e.id)
            })
            // 从搜索结果中移除已关闭的标签
            resultsDispatch({
                type: 'set',
                searchResult: {
                    type: 'tab',
                    results: searchResult.results.filter(result =>
                        !(result.type === 'tab' && tabs.map(e => e.id).indexOf(result.id) != -1)
                    )
                }
            })
        } catch (error) {
            console.error('关闭标签页失败:', error)
            alert('关闭失败，请重试')
        }
    }
    const clickBatchCloseSelectTabs = () => {
        batchCloseTabs(searchResult.results.filter(e => e.type === 'tab' && e.checked))
    }
    const clickCreateBookmarkGroup = () => {

        if (batchSelectCount.value === 0) {
            alert('请先选择标签页');
            return;
        }

        const groupName = prompt('请输入书签组名称：');
        if (!groupName) return;
        const selectedTabs: string[] = searchResult.results.filter(e => e.checked).map(e => e.id.toString())
        addToGroup(groupName, selectedTabs, () => {
            alert('书签组创建成功！');
            document.getElementById('cancelBtn').click();
        });
    }
    const clickSelectAll = () => {
        resultsDispatch({
            type: 'update',
            updateType: resultType,
            update: (searchResult) => {
            for (let result of searchResult.results) {
                result.checked = !result.checked
            }
        }})
    }
    return (<div className={styles["group-header"]}>
        <span>{typeLabels[resultType]}</span>
        {resultType === 'tab' && <div className={styles["batch-select-container"]}>
            {!showBatchSelect &&
                <>
                    <div v-if="!showBatchSelect" className={styles["tab-stats"]}>
                        {/*窗口:{{ tabStats.windowCount }} 标签页:{{ tabStats.tabCount }}*/}
                    </div>
                    <button onClick={clickBatchSelect} className={styles["action-btn"]}
                    >批量选择
                    </button>
                </>}
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

export function SearchResult({isLoading, resultType, hideUnmatched}: {
    isLoading: boolean, resultType: ResultType, hideUnmatched: boolean
}) {

    const searchResult = useSearchResults()[resultType]
    const [showBatchSelect, setShowBatchSelect] = useState(false)
    return (
        <>
            {searchResult && <div className={styles["search-box"]}>
                <SearchResultHeader searchResult={searchResult} setShowBatchSelect={setShowBatchSelect}
                                    showBatchSelect={showBatchSelect} hideUnmatched={hideUnmatched} >
                </SearchResultHeader>
                {isLoading && <div className={styles["loading"]}>加载中...</div>}
                {!isLoading && <SearchItems searchResult={searchResult} showBatchSelect={showBatchSelect}
                            />}
            </div>
            }
        </>
    )
}