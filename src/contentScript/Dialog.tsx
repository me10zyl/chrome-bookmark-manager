import React, {useState} from 'react';
import util from './util';
import {AddBookMark, BookmarkData, MessageRequest, RemoveBookMark} from "../js/commonDeclare";

function Footer(props: { onClick: () => void }) {
    return <div className="footer">
        <button onClick={props.onClick}>关闭
        </button>
    </div>;
}

function Header() {
    return <div className="header">
        <h2>书签管理器</h2>
    </div>;
}

function Content({data, setShow} : {data: BookmarkData, setShow: React.Dispatch<boolean>}) {
    const [showSave, setShowSave] = useState(false)
    const [groupName, setGroupName] = useState('')
    const addToGroup = () => {
        setShowSave(true)
    };

    const removeFromGroup = () => {
        //really remove
        chrome.runtime.sendMessage({ action: "removeFromBookmarkGroup", data: {
                tabId: data.tabId
            } as RemoveBookMark } as MessageRequest, (response : MessageRequest) => {
            console.log('removed!!!', response)
            setShow(false);
            alert('删除成功');
        });
    };

    const clickSave = () => {
        //really save
        setShowSave(false)
        chrome.runtime.sendMessage({ action: "addToBookmarkGroup", data: {
                bookmarkGroupName: groupName,
                tabId: data.tabId
            } as AddBookMark } as MessageRequest, (response : MessageRequest) => {
            setShow(false);
            alert(response.message);
        });
    }

    const clickCancel = () => {
        setShowSave(false)
    }
    return <div className="content">
        {showSave &&
            <div className="saveCancel">
                <input placeholder="书签组名称" value={groupName} onChange={(e)=>{setGroupName(e.target.value)}}/>
                <button onClick={clickSave}>保存</button>
                <button onClick={clickCancel}>取消</button>
            </div>
        }
        <div>
            {!showSave && <button onClick={data.addOrRemove === "add" ? addToGroup : removeFromGroup}>
                {data.addOrRemove === "add" ? "添加到标签组" : "从标签组移除"}
            </button>}
            {data.bookmarkGroupName && <span>(已添加到的组：{data.bookmarkGroupName})</span>}
        </div>
    </div>;
}

export default function Dialog({show, setShow, data}) {
    util.addCss(`.dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 20px;
      border: 1px solid #ccc;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 1000;
  }
  .content input{
     min-width: 200px;
     height: 30px;
     padding: 5px;
     border:1px solid #ccc;
   }
  
    .content {
      min-width: 300px;
      min-height: 100px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: start;
      gap: 10px;
    }
    .saveCancel{
     display: flex;
     gap: 10px;
    }
      
  .dialog button {
      margin-right: 10px;
      padding: 5px 10px;
      cursor: pointer;
  }`);



    return (
        <div className="dialog" style={{
            display: show ? 'block' : 'none'
        }}>
            <Header/>
            <Content data={data} setShow={setShow} />
            <Footer onClick={() => {
                setShow(!show)
            }}/>
        </div>
    );
}
