export type Action =  'removeFromBookmarkGroup' | 'addToBookmarkGroup'

export interface MessageRequest {
    action: Action,
    data : any
}