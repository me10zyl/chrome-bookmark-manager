document.addEventListener('DOMContentLoaded', function() {
    const groupsList = document.getElementById('groupsList');

    function loadBookmarkGroups() {
        chrome.bookmarks.search({title: '我的标签组'}, function(results) {
            if (results.length === 0) {
                displayGroups([]);
                return;
            }

            chrome.bookmarks.getChildren(results[0].id, function(children) {
                const bookmarkGroups = children.filter(child => 
                    child.title.startsWith('[TabGroup]')
                ).map(group => {
                    group.displayTitle = group.title.replace('[TabGroup]', '');
                    return group;
                });

                Promise.all(bookmarkGroups.map(group => 
                    new Promise(resolve => {
                        chrome.bookmarks.getChildren(group.id, children => {
                            group.children = children;
                            resolve(group);
                        });
                    })
                )).then(groups => {
                    displayGroups(groups);
                });
            });
        });
    }

    function displayGroups(groups) {
        if (groups.length === 0) {
            groupsList.innerHTML = `
                <div class="empty-state">
                    <p>还没有创建任何书签组</p>
                    <p class="empty-hint">在标签页管理中选择多个标签创建书签组</p>
                </div>
            `;
            return;
        }

        groupsList.innerHTML = '';


        // 渲染书签组
function renderBookmarkGroup(folder) {
    return `
       <div class="group-header">
                    <h3>${folder.displayTitle}</h3>
                    <div class="group-actions">
                         <div class="dropdown">
                            <button class="edit-group-btn" title="更多操作">
                                编辑
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                </svg>
                            </button>
                            <div class="dropdown-menu">
                                <button class="dropdown-item rename-group-btn">
                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                    </svg>
                                    <span>重命名</span>
                                </button>
                                <button class="dropdown-item delete-group-btn">
                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                    </svg>
                                    <span>删除</span>
                                </button>
                            </div>
                        </div>
                        <button class="open-all-btn" data-id="${folder.id}">打开所有</button>
                        <button class="delete-group-btn" data-id="${folder.id}">删除组</button>
                    </div>
                </div>
                <div class="bookmarks-list">
                    ${renderBookmarks(folder.children || [])}
                </div>
    `;
}

// 渲染书签列表
function renderBookmarks(bookmarks) {
    return bookmarks.map(bookmark => {      
        return `
            <div class="bookmark-item">
                ${bookmark.url ? `
                    <a href="${bookmark.url}" target="_blank">
                        <span class="bookmark-title">${bookmark.title}</span>
                        <span class="bookmark-url">${bookmark.url}</span>
                    </a>
                ` : ''}
            </div>
        `;
    }).join('');
}

 
        
        groups.forEach(folder => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'group-item';
            
            groupDiv.innerHTML = renderBookmarkGroup(folder);
            
            groupsList.appendChild(groupDiv);
        });

        addEventListeners();
    }

    function addEventListeners() {
        document.querySelectorAll('.open-all-btn').forEach(button => {
            button.addEventListener('click', function() {
                const groupId = this.dataset.id;
                chrome.bookmarks.getChildren(groupId, function(bookmarks) {
                    bookmarks.forEach(bookmark => {
                        if (bookmark.url) {
                            chrome.tabs.create({ url: bookmark.url });
                        }
                    });
                });
            });
        });

        document.querySelectorAll('.delete-group-btn').forEach(button => {
            button.addEventListener('click', function() {
                if (confirm('确定要删除这个书签组吗？')) {
                    const groupId = this.dataset.id;
                    chrome.bookmarks.removeTree(groupId, function() {
                        loadBookmarkGroups();
                    });
                }
            });
        });

        document.querySelectorAll('.bookmark-item a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const url = this.getAttribute('href');
                chrome.tabs.create({ url: url });
            });
        });

        // 编辑按钮点击事件
        document.addEventListener('click', function(e) {
            const editBtn = e.target.closest('.edit-group-btn');
            if (editBtn) {
                e.stopPropagation();
                const dropdownMenu = editBtn.closest('.dropdown').querySelector('.dropdown-menu');
                
                // 关闭其他所有下拉菜单
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    if (menu !== dropdownMenu) {
                        menu.classList.remove('show');
                    }
                });
                
                // 切换当前下拉菜单
                dropdownMenu.classList.toggle('show');
            }
        });

        // 重命名按钮点击事件
        document.addEventListener('click', function(e) {
            const renameBtn = e.target.closest('.rename-group-btn');
            if (renameBtn) {
                console.log('重命名按钮被点击了')
                e.stopPropagation();
                const group = renameBtn.closest('.bookmark-group');
                const titleContainer = group.querySelector('.group-title-container');
                const editForm = group.querySelector('.group-edit-form');
                const input = editForm.querySelector('.group-name-input');
                
                // 隐藏下拉菜单
                renameBtn.closest('.dropdown-menu').classList.remove('show');
                
                // 显示编辑表单
                titleContainer.style.display = 'none';
                editForm.style.display = 'flex';
                input.focus();
                input.select();
            }
        });

        // 删除按钮点击事件
        document.addEventListener('click', function(e) {
            const deleteBtn = e.target.closest('.delete-group-btn');
            if (deleteBtn) {
                e.stopPropagation();
                const group = deleteBtn.closest('.bookmark-group');
                const groupId = group.dataset.groupId;
                const title = group.querySelector('.group-title').textContent;
                
                if (confirm(`确定要删除书签组 "${title}" 吗？`)) {
                    chrome.bookmarks.removeTree(groupId, () => {
                        group.remove();
                    });
                }
                
                // 隐藏下拉菜单
                deleteBtn.closest('.dropdown-menu').classList.remove('show');
            }
        });

        // 保存按钮点击事件
        document.addEventListener('click', function(e) {
            const saveBtn = e.target.closest('.save-name-btn');
            if (saveBtn) {
                const group = saveBtn.closest('.bookmark-group');
                const input = group.querySelector('.group-name-input');
                const newTitle = input.value.trim();
                
                if (newTitle) {
                    updateGroupName(group.dataset.groupId, newTitle, group);
                }
            }
        });

        // 取消按钮点击事件
        document.addEventListener('click', function(e) {
            const cancelBtn = e.target.closest('.cancel-edit-btn');
            if (cancelBtn) {
                const group = cancelBtn.closest('.bookmark-group');
                hideRenameForm(group);
            }
        });

        // 点击页面其他地方关闭下拉菜单
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });

        // 添加回车键保存功能
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const input = document.activeElement;
                if (input.classList.contains('group-name-input')) {
                    const group = input.closest('.bookmark-group');
                    const newTitle = input.value.trim();
                    
                    if (newTitle) {
                        updateGroupName(group.dataset.groupId, newTitle, group);
                    }
                }
            } else if (e.key === 'Escape') {
                const input = document.activeElement;
                if (input.classList.contains('group-name-input')) {
                    const group = input.closest('.bookmark-group');
                    hideRenameForm(group);
                }
            }
        });
    }

    // 更新组名
    function updateGroupName(groupId, newTitle, group) {
        chrome.bookmarks.update(groupId, { title: newTitle }, () => {
            group.querySelector('.group-title').textContent = newTitle;
            hideRenameForm(group);
        });
    }

    // 隐藏重命名表单
    function hideRenameForm(group) {
        const titleContainer = group.querySelector('.group-title-container');
        const editForm = group.querySelector('.group-edit-form');
        titleContainer.style.display = 'flex';
        editForm.style.display = 'none';
    }

    loadBookmarkGroups();
}); 