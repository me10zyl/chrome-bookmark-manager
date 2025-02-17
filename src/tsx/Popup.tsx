import {clickBtn} from "../js/bookmarkGroup";
import styles from '../css/Popup.module.css'


export default function Popup() {
    const openSideBar = async (id: string) => {
        let url = `index.html#/${id}`;
        let tabs = await chrome.tabs.query({
            active: true
        });
        if (tabs.length > 0) {
            console.log('tabs', tabs)
            tabs.sort((a, b) => {
                const lastAccessedA = a.lastAccessed || 0;
                const lastAccessedB = b.lastAccessed || 0;
                return lastAccessedB - lastAccessedA;
            })
            console.log('set sidebar opts')
            console.log('activeTab', tabs[0])
            let opts = await chrome.sidePanel.getOptions({
                tabId: tabs[0].id
            });
            if (!opts.enabled) {
                await chrome.sidePanel.setOptions({
                    path: url,
                    enabled: true,
                    tabId: tabs[0].id
                })
                if (tabs[0].id) {
                    await chrome.sidePanel.open({tabId: tabs[0].id})
                }
                console.log('open sidebar')
            } else {
                console.log('close sidebar')
                await chrome.sidePanel.setOptions({
                    enabled: false,
                    tabId: tabs[0].id
                })
            }
        }
    }
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <img src="/images/icon48.png" className={styles.logo} alt="logo"/>
                <h1>书签管理器</h1>
            </div>
            <div className={styles['button-group']}>
                <button id="openSearch" className={styles.btnPrimary} aa='1' onClick={() => clickBtn('search')}>
                    <span className={styles.icon}>🔍</span>
                    全局搜索
                </button>
                <button id="openGroups" className={styles.btnSecondary} onClick={() => {
                    clickBtn('bookmarkGroups')
                }}>
                    <span className={styles.icon}>📚</span>
                    书签组管理
                </button>
            </div>
        </div>
    )
}