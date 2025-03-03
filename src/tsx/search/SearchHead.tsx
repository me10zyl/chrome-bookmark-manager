import styles from "../../css/Search.module.css";
import {Dropdown, DropdownItem} from "../common/Dropdown";
import React, {useContext} from "react";
import {useSearchResults, useSearchResultsDispatch} from "./SearchResultsContext";
import {flushSync} from "react-dom";
import {FaEye, FaEyeSlash} from 'react-icons/fa';
import {Result} from "../../js/search";

interface SearchHeadProps {
    doSearch: () => void;
    searchText: string;
    setSearchText: (text: string) => void;
    lastUpdated: string;
    hideUnmatched: boolean;
    setHideUnmatched: (hide: boolean) => void;
    searchInputRef: React.MutableRefObject<HTMLInputElement | null>;
}

export function SearchHead({
                               doSearch,
                               searchText,
                               setSearchText,
                               lastUpdated,
                               hideUnmatched,
                               setHideUnmatched,
                               searchInputRef
                           }: SearchHeadProps) {
    let searchResults = useSearchResults();
    console.log('searchResults', searchResults)
    let resultsDispatch = useSearchResultsDispatch();
    const onChangeSearchText = (e) => {
        setSearchText(e.target.value)
    }
    const closeAllGroups = () => {
        (async () => {
            const allTabIds: number[] = [];
            const groups = await chrome.tabGroups.query({});
            for (const group of groups) {
                const tabs = await chrome.tabs.query({groupId: group.id});
                const tabIds = tabs.map(tab => tab.id);
                await chrome.tabs.remove(tabIds); // 关闭分组中的所有标签
                allTabIds.push(...tabIds); // 将当前分组的标签ID添加到数组中
            }
            console.log("All tab groups have been closed!");
            flushSync(() => {
                resultsDispatch({
                    type: 'set',
                    searchResult: {
                        type: 'tab',
                        results: searchResults.tab.results.filter((r) => {
                            return !allTabIds.includes(r.id)
                        })
                    }
                })
            })

            alert('已关闭所有分组标签')
        })();
    }

    const findDuplicateTabs = () => {
        const tabResults = searchResults.tab.results;
        const urlMap = new Map();
        const duplicates:Result[] = [];

        tabResults.forEach(tab => {
            if (urlMap.has(tab.url)) {
                duplicates.push(tab);
                if (!duplicates.includes(urlMap.get(tab.url))) {
                    duplicates.push(urlMap.get(tab.url));
                }
            } else {
                urlMap.set(tab.url, tab);
            }
        });
        resultsDispatch({
            type: 'set',
            searchResult: {
                type: 'tab',
                results: searchResults.tab.results.map(r => {
                    return {
                        ...r,
                        highlight: duplicates.some(d => d.id === r.id)
                    }
                })
            }
        })
    }

    const closeDuplicateTabs = async () => {
        const tabResults = searchResults.tab.results;
        const urlMap = new Map();
        const tabsToClose:number[] = [];
        console.log('tabs', tabResults)
        const sortTabResults = [];
        // 分离有 groupId 和没有 groupId 的项
        const withGroupId = tabResults.filter(tab => tab.groupId !== -1);
        const withoutGroupId = tabResults.filter(tab => tab.groupId === -1);

        // 合并结果，有 groupId 的在前
        sortTabResults.push(...withGroupId, ...withoutGroupId);
        tabResults.forEach(tab => {
            if (urlMap.has(tab.url)) {
                tabsToClose.push(tab.id);
            } else {
                urlMap.set(tab.url, tab);
            }
        });

        let ids = tabResults.filter(tab=>tab.url?.startsWith('chrome://')).map(e=>e.id);
        if(ids.length > 0) {
            tabsToClose.push(...ids)
        }

        if (tabsToClose.length > 0) {
            await chrome.tabs.remove(tabsToClose);
            flushSync(() => {
                resultsDispatch({
                    type: 'set',
                    searchResult: {
                        type: 'tab',
                        results: searchResults.tab.results.filter(r => !tabsToClose.includes(r.id))
                    }
                })
            });
            alert(`已关闭 ${tabsToClose.length} 个重复/多余的标签页`);
        } else {
            alert('没有找到重复的/多余的标签页');
        }
    }

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
                <div>
                    <button
                        className={styles['visibility-toggle']}
                        onClick={() => setHideUnmatched(!hideUnmatched)}
                        title={hideUnmatched ? "显示所有项" : "只显示匹配项"}
                        style={{display: 'none'}}
                    >
                        {hideUnmatched ? <FaEyeSlash/> : <FaEye/>}
                    </button>
                    <Dropdown>
                        <DropdownItem onClick={closeAllGroups}>
                            关闭所有的分组
                        </DropdownItem>
                        <DropdownItem onClick={closeDuplicateTabs}>
                            关闭重复/多余标签页
                        </DropdownItem>
                    </Dropdown>
                </div>
            </div>
            <div className={styles["search-wrapper"]}>
                <input type="text" id={styles.searchInput} placeholder="搜索标签页、书签、历史记录..."
                       autoFocus={true}
                       ref={searchInputRef}
                       onChange={onChangeSearchText}
                       value={searchText}/>
                <div className={styles["search-icon"]}>🔍</div>
            </div>
        </>
    )
}