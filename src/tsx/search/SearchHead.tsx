import styles from "../../css/Search.module.css";

export function SearchHead({doSearch, searchText, setSearchText, lastUpdated}) {


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