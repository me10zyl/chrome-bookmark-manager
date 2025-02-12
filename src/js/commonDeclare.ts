export type Action =  'showDialog' | 'removeFromBookmarkGroup' | 'addToBookmarkGroup'

export interface MessageRequest {
    action: Action,
    data : any,
    message?: string
}

export interface BookmarkData {
    addOrRemove: 'add' | 'remove'
    bookmarkGroupName: string
    tabUrl: string
    bookmarkGroups: chrome.bookmarks.BookmarkTreeNode[],
    bookmarkGroupId: string,
    tabId: number
}

export interface AddBookMark {
    bookmarkGroupName: string,
    tabId: number
}

export interface RemoveBookMark {
    tabId: number
}