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
        
        groups.forEach(folder => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'group-item';
            
            groupDiv.innerHTML = `
                <div class="group-header">
                    <h3>${folder.displayTitle}</h3>
                    <div class="group-actions">
                        <button class="edit-group-btn" data-id="${folder.id}">编辑</button>
                        <button class="open-all-btn" data-id="${folder.id}">打开所有</button>
                        <button class="delete-group-btn" data-id="${folder.id}">删除组</button>
                    </div>
                </div>
                <div class="bookmarks-list">
                    ${folder.children ? folder.children.map(bookmark => `
                        <div class="bookmark-item">
                            ${bookmark.url ? `
                                <a href="${bookmark.url}" target="_blank">
                                    <span class="bookmark-title">${bookmark.title}</span>
                                    <span class="bookmark-url">${bookmark.url}</span>
                                </a>
                            ` : ''}
                        </div>
                    `).join('') : ''}
                </div>
            `;
            
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
    }

    loadBookmarkGroups();
}); 