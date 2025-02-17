import {useEffect, useRef, useState} from "react";
import styles from '../../css/Search.module.css';
import {CONFIG, search, SearchResults} from "../../js/search";
import {MessageRequest} from "../../js/commonDeclare";
import {useImmer} from "use-immer";
import {SearchHead} from "./SearchHead";
import {SearchResult} from "./SearchResult";


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
