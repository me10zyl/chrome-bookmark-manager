import styles from '../css/SearchItems.module.css'
import {formatTimeAgo, SearchResult, typeLabels} from "../js/search";
import {useState} from "react";

export default function SearchItems({searchResult, showBatchSelect}: { searchResult: SearchResult }) {

    function closeTab() {

    }

    return (
        <>
            {searchResult.results.map(tab => (
                <div key={tab.id} className={styles["result-item"]}>
                    <div className={styles["result-content"]}>
                        {showBatchSelect &&
                            <input type="checkbox" className={styles["select-checkbox"]} v-model="tab.checked"/>}
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
                            onClick={closeTab}
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