import styles from '../../css/SearchItems.module.css'
import {formatTimeAgo, SearchResult, typeLabels} from "../../js/search";
import {useState} from "react";
import {useSearchResultsDispatch} from "./SearchResultsContext";

export default function SearchItems({searchResult, showBatchSelect}) {
    let resultsDispatch = useSearchResultsDispatch();
    async function closeTab(tab) {
        try {
            if(tab.groupId > 0){
                if(!confirm(`该标签页有分组（${tab.groupTitle}）确认删除？`)){
                    return
                }
            }
            await chrome.tabs.remove(tab.id)
            // 从搜索结果中移除已关闭的标签
            resultsDispatch({
                type: 'update',
                updateType: 'tab',
                update: (r)=>{
                    r.results = r.results.filter(result =>
                       !(result.type === 'tab' && result.id === tab.id)
                    )
                }
            })
        } catch (error) {
            console.error('关闭标签页失败:', error)
            alert('关闭失败，请重试')
        }
    }

    const onClickResult = (result)=>{
        if (result.type === 'bookmark') {
            // 打开书签
            chrome.tabs.create({url: result.url})
        } else if (result.type === 'tab') {
            // 切换到对应标签页
            chrome.tabs.update(result.id, {active: true})
            chrome.windows.update(result.windowId, {focused: true})
        } else if (result.type === 'history') {
            chrome.tabs.create({url: result.url})
        }
    }

    return (
        <>
            {searchResult.results.map(tab => (
                <div key={tab.id} className={styles["result-item"] + " " + (tab.highlight ? styles['highlight-match'] :'')}>
                    <div className={styles["result-content"]}>
                        {showBatchSelect &&
                            <input type="checkbox" className={styles["select-checkbox"]} checked={tab.checked}
                                onChange={(e)=>{
                                    resultsDispatch({
                                        type: 'update',
                                        updateType: 'tab',
                                        update: (r)=>{
                                            r.results.map((t)=>{
                                                if(t.id === tab.id){
                                                    t.checked = e.target.checked
                                                }
                                            })
                                    }})
                                }}
                            />}
                        {tab.favicon ? <img src={tab.favicon} className={styles["result-icon"]} loading="lazy" alt=""/>: <i className={styles["result-icon"]}></i>}
                        <div className={styles["result-info"]} onClick={(e)=>{
                            onClickResult(tab)
                        }}>
                            <div className={styles["result-title"]}>{tab.title || '无标题'}</div>
                            <div className={styles["result-url"]}>{tab.url}</div>
                            <div className={styles["result-time"]}>{formatTimeAgo(tab.lastAccessed)}</div>
                        </div>
                        {tab.groupTitle && <span className={styles["tab-group-title"]}>{tab.groupTitle}</span>}
                        <span className={styles["result-type"] + ' ' + styles['type-tab']}>{typeLabels[searchResult.type]}</span>
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