import React, {useState} from 'react';
import util from './util';

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

export default function Dialog({show, setShow, addOrRemove, bookmarkGroupName}) {
    const [showSave, setShowSave] = useState(false)
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
  
  .dialog button {
      margin-right: 10px;
      padding: 5px 10px;
      cursor: pointer;
  }`);

    const addToGroup = () => {
        setShowSave(true)
    };

    const removeFromGroup = () => {
        //really remove
    };

    const clickSave = () => {
        //really save
        setShowSave(false)
    }

    const clickCancel = () => {
        setShowSave(false)
    }

    return (
        <div className="dialog" style={{
            display: show ? 'block' : 'none'
        }}>
            <Header/>
            <div className="content">
                {addOrRemove === 'add' &&
                    <div className="saveCancel">
                        <input placeholder="书签组名称"/>
                        <button onClick={clickSave}>保存</button>
                        <button onClick={clickCancel}>取消</button>
                    </div>
                }
                <div>
                    <button onClick={addOrRemove === 'add' ? addToGroup : removeFromGroup}>
                        {addOrRemove === 'add' ? '添加到标签组' : '从标签组移除'}
                    </button>
                    <span>(已添加到的组：{bookmarkGroupName})</span>
                </div>
            </div>
            <Footer onClick={() => {
                setShow(!show)
            }}/>
        </div>
    );
}
