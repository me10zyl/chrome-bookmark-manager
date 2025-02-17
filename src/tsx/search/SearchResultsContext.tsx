import {ResultType, SearchResult, SearchResults} from "../../js/search";
import {createContext, useContext, useReducer} from "react";
import {useImmerReducer} from "use-immer";

export interface SearchResultsDispatch {
    type: 'sets' | 'update' | 'set',
    searchResults?: SearchResults,
    searchResult?: SearchResult,
    updateType?: ResultType,
    update?: (searchResult: SearchResult) => void,
}

const intialSearchResults: SearchResults = {
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
};
const SearchResultsContext = createContext(null)

const SearchResultsDispatchContext = createContext(null);

function SearchResultsReducer(state: SearchResults, action: SearchResultsDispatch) {
    switch (action.type) {
        case 'sets':
            return action.searchResults
        case 'update':
            action.update(state[action.updateType]);
            break;
        case 'set':
            return action.searchResult;
        default:
            throw new Error(`Unhandled action type: ${action.type}`)
    }
}
export function SearchResultsProvider({children}) {
    const [searchResults, dispatch] = useImmerReducer<SearchResults, SearchResults>(SearchResultsReducer, intialSearchResults);

    return (
        <SearchResultsContext.Provider value={searchResults}>
            <SearchResultsDispatchContext.Provider value={dispatch}>
                {children}
            </SearchResultsDispatchContext.Provider>
        </SearchResultsContext.Provider>
    )
}

export function useSearchResults(){
    return useContext(SearchResultsContext);
}

export function useSearchResultsDispatch(): React.Dispatch<SearchResultsDispatch>{
    return useContext(SearchResultsDispatchContext);
}