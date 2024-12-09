document.addEventListener('DOMContentLoaded', function() {
    const bookmarksList = document.getElementById('bookmarksList');
    const searchInput = document.getElementById('searchInput');

    // 加载所有书签
    function loadBookmarks() {
        chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
            displayBookmarks(bookmarkTreeNodes);
        });
    }

    // 显示书签
    function displayBookmarks(bookmarkNodes) {
        bookmarksList.innerHTML = '';
        
        function processNode(nodes) {
            for (const node of nodes) {
                if (node.url) {
                    const bookmarkDiv = document.createElement('div');
                    bookmarkDiv.className = 'bookmark-item';
                    
                    bookmarkDiv.innerHTML = `
                        <div class="bookmark-title">
                            <a href="${node.url}" target="_blank">${node.title}</a>
                        </div>
                        <div class="bookmark-url">${node.url}</div>
                        <button class="delete-btn" data-id="${node.id}">删除</button>
                    `;
                    
                    bookmarksList.appendChild(bookmarkDiv);
                }
                if (node.children) {
                    processNode(node.children);
                }
            }
        }
        
        processNode(bookmarkNodes);
        
        // 添加删除功能
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const bookmarkId = this.getAttribute('data-id');
                chrome.bookmarks.remove(bookmarkId, function() {
                    loadBookmarks();
                });
            });
        });
    }

    // 搜索功能
    searchInput.addEventListener('input', function() {
        const searchText = this.value.toLowerCase().trim();
        if (searchText === '') {
            // 如果搜索框为空，显示所有书签
            loadBookmarks();
        } else {
            // 否则执行搜索
            chrome.bookmarks.search(searchText, function(results) {
                displayBookmarks([{ children: results }]);
            });
        }
    });

    // 初始加载
    loadBookmarks();
}); 