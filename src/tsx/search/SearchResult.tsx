import {useMemo, useState} from "react";
import styles from "../../css/Search.module.css";
import SearchItems from "./SearchItems";
import {Result, typeLabels} from "../../js/search";
import {addToGroup} from "../../js/bookmarkGroup";

function SearchResultHeader({searchResult, showBatchSelect, setShowBatchSelect, setSearchResults}) {
    const resultType = searchResult.type;
    const clickBatchSelect = () => {
        setShowBatchSelect(!showBatchSelect)
        setSearchResults(sr => {
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
            if (tabs.some(e => e.groupId > 0)) {
                if (!confirm(`该标签页有分组，确认删除？`)) {
                    return
                }
            }
            tabs.forEach(e => {
                chrome.tabs.remove(e.id)
            })
            // 从搜索结果中移除已关闭的标签
            setSearchResults(sr => {
                sr.tab.results = searchResult.results.filter(result =>
                    !(result.type === 'tab' && tabs.map(e => e.id).indexOf(result.id) != -1)
                )
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
        setSearchResults((sr) => {
            for (let result of sr.tab.results) {
                result.checked = !result.checked
            }
        })


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

export function SearchResult({searchResult, isLoading, setSearchResults}: {
    searchResult: SearchResult,
    isLoading: boolean
}) {

    const [showBatchSelect, setShowBatchSelect] = useState(false)
    return (
        <>
            {searchResult && <div className={styles["search-box"]}>
                <SearchResultHeader searchResult={searchResult} setShowBatchSelect={setShowBatchSelect}
                                    showBatchSelect={showBatchSelect} setSearchResults={setSearchResults}>
                </SearchResultHeader>
                {isLoading && <div className={styles["loading"]}>加载中...</div>}
                <SearchItems searchResult={searchResult} showBatchSelect={showBatchSelect}
                             setSearchResults={setSearchResults}/>
            </div>
            }
        </>
    )
}