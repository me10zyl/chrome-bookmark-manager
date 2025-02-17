import {useState} from "react";
import styles from '../../css/Dropdown.module.css'

export function Dropdown({children}) {
    const [show,setShow] = useState(false)
    return (<div className={styles.dropdown}>
        <button className={styles['edit-group-btn']} title="更多操作"
                onClick={()=>{setShow(!show)}}>
            <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                    d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
        </button>
        <div className={styles['dropdown-menu'] + " " + (show ? styles.show : '')}>
            {children}
        </div>
    </div>)
}

export function DropdownItem({children, onClick}) {
    return (<button className={styles['dropdown-item']} onClick={onClick}>{children}</button>)
}
