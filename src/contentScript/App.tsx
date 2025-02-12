import {Action} from "../js/commonDeclare";
import Dialog from "./Dialog";
export interface MessageRequest {
    action: Action,
    data : any
}
import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
import {useState} from "react";

function onReceiveMessage(setShow, setData){
    chrome.runtime.onMessage.addListener( (request :MessageRequest, sender, sendResponse)=>{
        switch (request.action) {
            case 'addToBookmarkGroup':
                console.log('addToBookmarkGroup', request.data);
                setShow(true)
                setData(request.data)
                break;
            case 'removeFromBookmarkGroup':
                console.log('removeFromBookmarkGroup', request.data);
                setShow(true)
                setData(request.data)
                break;
        }
    })
}
function App(){
    const [show, setShow] = useState(false)
    const [data, setData] = useState({
        addOrRemove: 'add',
        bookmarkGroupName: ''
    })
    console.log('app start')
    onReceiveMessage(setShow, setData)
    return (<>
        <Dialog show={show} setShow={setShow} {...data} />
    </>)
}
export default App;