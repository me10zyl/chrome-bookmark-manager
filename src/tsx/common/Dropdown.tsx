export function Dropdown({children}) {
    return (<div class="dropdown">
        <button class="edit-group-btn" title="更多操作"
                onClick="show = !show">
            <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                    d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
        </button>
        <div className="{'dropdown-menu': true, show: show}">
            {children}
        </div>
    </div>)
}

export function DropdownItem(){

}