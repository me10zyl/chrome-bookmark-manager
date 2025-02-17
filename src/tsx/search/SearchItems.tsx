import styles from '../../css/SearchItems.module.css'
import {formatTimeAgo, SearchResult, typeLabels} from "../../js/search";
import {useState} from "react";

export default function SearchItems({searchResult, showBatchSelect, setSearchResults}: { searchResult: SearchResult }) {

    async function closeTab(tab) {
        try {
            if(tab.groupId > 0){
                if(!confirm(`该标签页有分组（${tab.groupTitle}）确认删除？`)){
                    return
                }
            }
            await chrome.tabs.remove(tab.id)
            // 从搜索结果中移除已关闭的标签
            setSearchResults((r)=>{
                r.tab.results = searchResult.results.filter(result =>
                !(result.type === 'tab' && result.id === tab.id)
            )})
        } catch (error) {
            console.error('关闭标签页失败:', error)
            alert('关闭失败，请重试')
        }
    }

    return (
        <>
            {searchResult.results.map(tab => (
                <div key={tab.id} className={styles["result-item"]}>
                    <div className={styles["result-content"]}>
                        {showBatchSelect &&
                            <input type="checkbox" className={styles["select-checkbox"]} value={tab.checked}
                                onChange={(e)=>{
                                    setSearchResults((r)=>{
                                        r.tab.results.map((t)=>{
                                            if(t.id === tab.id){
                                                t.checked = e.target.checked
                                            }
                                        })
                                    })
                                }}
                            />}
                        {tab.favicon ? <img src={tab.favicon} className={styles["result-icon"]} alt=""/>: <i className={styles["result-icon"]}></i>}
                        <div className={styles["result-info"]} onClick="emits('handleResultClick',tab)">
                            <div className={styles["result-title"]}>{tab.title || '无标题'}</div>
                            <div className={styles["result-url"]}>{tab.url}</div>
                            <div className={styles["result-time"]}>{formatTimeAgo(tab.lastAccessed)}</div>
                        </div>
                        {tab.groupTitle && <span className={styles["tab-group-title"]}>{tab.groupTitle}</span>}
                        <span className={styles["result-type"] + ' ' + styles['type-tab']}>{typeLabels['tab']}</span>
                    </div>
                    {searchResult.type === 'tab' && <div className={styles["result-actions"]}>
                        <button
                            className={styles["action-btn"] + ' ' + styles['close-tab-btn']}
                            title="关闭标签页"
                            onClick={()=>{closeTab(tab)}}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path
                                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>}
                </div>
            ))}
        </>
    )
}