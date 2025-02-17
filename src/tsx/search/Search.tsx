import {useEffect, useRef, useState} from "react";
import styles from '../../css/Search.module.css';
import {CONFIG, search} from "../../js/search";
import {MessageRequest} from "../../js/commonDeclare";
import {SearchHead} from "./SearchHead";
import {SearchResult} from "./SearchResult";
import {SearchResultsProvider, useSearchResults, useSearchResultsDispatch} from "./SearchResultsContext";

function Search() {
    const searchResultsDispatch = useSearchResultsDispatch();
    const [searchText, setSearchText] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [lastUpdated, setLastUpdated] = useState('')
    const [showResults, setShowResults] = useState(false)

    const doSearch = () => {
        search({searchText, setIsLoading, setShowResults, setLastUpdated, searchResultsDispatch})
    }

    const handleMessage = (message: MessageRequest) => {
        if (message.action === 'updateSearchResults') {
            doSearch();
        }
    }

    const init = () => {
        useEffect(() => {
            chrome.runtime.onMessage.addListener(handleMessage);
            return () => {
                chrome.runtime.onMessage.removeListener(handleMessage);
            };
        }, [])
        const timeoutId = useRef<number | undefined>(undefined)
        useEffect(() => {
            clearTimeout(timeoutId.current)
            timeoutId.current = setTimeout(doSearch, CONFIG.debounceTime)
            return () => {
                clearTimeout(timeoutId.current)
            }
        }, [searchText]);
    }

    init()

    return (
        <>
            <SearchHead doSearch={doSearch} searchText={searchText} setSearchText={setSearchText}
                        lastUpdated={lastUpdated}></SearchHead>
            <div id="searchResults" className={styles["results-container"]}>
                <SearchResult isLoading={isLoading} resultType='tab'></SearchResult>
                <SearchResult isLoading={isLoading} resultType='history'></SearchResult>
                <SearchResult isLoading={isLoading} resultType='bookmark'></SearchResult>
            </div>
        </>
    )
}


export default function SearchWrapper() {
    return (<div className={styles["search-container"]}>
        <SearchResultsProvider>
            <Search/>
        </SearchResultsProvider>
    </div>)
}
