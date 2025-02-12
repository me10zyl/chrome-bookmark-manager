import {MessageRequest, BookmarkData} from "../js/commonDeclare";
import Dialog from "./Dialog";

import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
import {useState} from "react";

function onReceiveMessage(setShow, setData){
    chrome.runtime.onMessage.addListener( (request :MessageRequest, sender, sendResponse)=>{
        switch (request.action) {
            case 'showDialog':
                console.log('showDialog', request.data);
                setShow(true)
                setData(request.data)
                break;
        }
        sendResponse({
            action: request.action,
            data: 'ok'
        } as MessageRequest)
    })
}
function App(){
    const [show, setShow] = useState(false)
    const [data, setData] = useState<BookmarkData>({
        addOrRemove: undefined, bookmarkGroupId: "", bookmarkGroupName: "", bookmarkGroups: [], tabId: 0, tabUrl: ""
    })
    console.log('app start')
    onReceiveMessage(setShow, setData)
    return (<>
        <Dialog show={show} setShow={setShow} data={data} />
    </>)
}
export default App;