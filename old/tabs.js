document.addEventListener('DOMContentLoaded', function() {
    const tabsList = document.getElementById('tabsList');
    const searchInput = document.getElementById('searchInput');

    // 添加批量选择相关的变量
    let isSelectMode = false;
    const selectedTabs = new Set();
    
    // 添加批量操作按钮到页面顶部
    const actionBar = document.createElement('div');
    actionBar.className = 'action-bar';
    actionBar.innerHTML = `
        <button id="toggleSelectMode" class="action-btn">批量选择</button>
        <div class="batch-actions" style="display: none;">
            <button id="selectAll" class="action-btn">全选</button>
            <button id="createGroup" class="action-btn">创建书签组</button>
            <span class="selected-count">已选择: 0</span>
        </div>
    `;
    document.querySelector('.container').insertBefore(actionBar, document.querySelector('.search-box'));

    // 切换选择模式
    document.getElementById('toggleSelectMode').addEventListener('click', function() {
        isSelectMode = !isSelectMode;
        this.textContent = isSelectMode ? '取消选择' : '批量选择';
        document.querySelector('.batch-actions').style.display = isSelectMode ? 'flex' : 'none';
        document.querySelectorAll('.tab-item').forEach(item => {
            item.classList.toggle('select-mode');
        });
        if (!isSelectMode) {
            selectedTabs.clear();
            updateSelectedCount();
        }
    });

    // 全选按钮
    document.getElementById('selectAll').addEventListener('click', function() {
        document.querySelectorAll('.tab-item').forEach(item => {
            item.classList.add('selected');
            selectedTabs.add(item.dataset.tabId);
        });
        updateSelectedCount();
    });

    // 创建书签组
    document.getElementById('createGroup').addEventListener('click', function() {
        if (selectedTabs.size === 0) {
            alert('请先选择标签页');
            return;
        }

        const groupName = prompt('请输入书签组名称：');
        if (!groupName) return;

        // 首先确保有一个根文件夹
        ensureRootFolder().then(rootFolder => {
            // 在根文件夹下创建新的书签组
            chrome.bookmarks.create({
                title: `[TabGroup]${groupName}`,
                parentId: rootFolder.id
            }, function(folder) {
                chrome.tabs.query({}, function(tabs) {
                    const selectedTabsInfo = tabs.filter(tab => selectedTabs.has(tab.id.toString()));
                    
                    Promise.all(selectedTabsInfo.map(tab => {
                        return new Promise((resolve) => {
                            chrome.bookmarks.create({
                                parentId: folder.id,
                                title: tab.title,
                                url: tab.url
                            }, resolve);
                        });
                    })).then(() => {
                        alert('书签组创建成功！');
                        document.getElementById('toggleSelectMode').click();
                    });
                });
            });
        });
    });

    // 确保根文件夹存在
    function ensureRootFolder() {
        return new Promise((resolve) => {
            chrome.bookmarks.search({title: '我的标签组'}, function(results) {
                if (results.length > 0) {
                    // 如果找到了根文件夹，直接返回
                    resolve(results[0]);
                } else {
                    // 如果没找到，创建一个新的根文件夹
                    chrome.bookmarks.create({
                        title: '我的标签组',
                        parentId: '1'  // 在书签栏中创建
                    }, resolve);
                }
            });
        });
    }

    function updateSelectedCount() {
        document.querySelector('.selected-count').textContent = `已选择: ${selectedTabs.size}`;
    }

    // 从URL中提取域名
    function getDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (e) {
            return '其他';
        }
    }

    // 按域名对标签页进行分组
    function groupTabsByDomain(tabs) {
        const groups = {};
        tabs.forEach(tab => {
            const domain = getDomain(tab.url);
            if (!groups[domain]) {
                groups[domain] = [];
            }
            groups[domain].push(tab);
        });
        return groups;
    }

    // 检查URL是否已被收藏
    async function isBookmarked(url) {
        return new Promise((resolve) => {
            chrome.bookmarks.search({ url: url }, function(results) {
                resolve(results.length > 0);
            });
        });
    }

    // 更新显示标签页的函数
    async function displayTabs(tabs) {
        tabsList.innerHTML = '';
        const groups = groupTabsByDomain(tabs);
        const sortedDomains = Object.keys(groups).sort((a, b) => 
            groups[b].length - groups[a].length
        );

        for (const domain of sortedDomains) {
            const domainTabs = groups[domain];
            const groupDiv = document.createElement('div');
            groupDiv.className = 'domain-group';
            
            const groupHeader = document.createElement('div');
            groupHeader.className = 'domain-header';
            groupHeader.innerHTML = `
                <div class="domain-info">
                    <span class="domain-name">${domain}</span>
                    <span class="tab-count">${domainTabs.length}个标签页</span>
                </div>
                <div class="group-actions">
                    <button class="collapse-btn">展开/折叠</button>
                    <button class="close-group-btn">关闭组</button>
                </div>
            `;
            
            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'tabs-container';

            // 为每个标签检查书签状态
            for (const tab of domainTabs) {
                const isBookmarkedTab = await isBookmarked(tab.url);
                const tabDiv = document.createElement('div');
                tabDiv.className = 'tab-item';
                tabDiv.dataset.tabId = tab.id;
                const favicon = tab.url.includes('tabs.html') ? 
                '⚙️' : `<img src="${tab.favIconUrl || 'default-favicon.png'}" alt="favicon">`;
                tabDiv.innerHTML = `
                    <div class="tab-favicon">
                        ${favicon}
                    </div>
                    <div class="tab-info">
                        <div class="tab-title">
                            ${tab.title}
                            ${isBookmarkedTab ? '<span class="bookmark-indicator">🔖</span>' : ''}
                        </div>
                        <div class="tab-url">${tab.url}</div>
                    </div>
                    <div class="tab-actions">
                        <button class="bookmark-btn ${isBookmarkedTab ? 'bookmarked' : ''}" data-url="${tab.url}" data-title="${tab.title}">
                            ${isBookmarkedTab ? '取消收藏' : '收藏'}
                        </button>
                        <button class="switch-btn" data-id="${tab.id}">切换</button>
                        <button class="close-btn" data-id="${tab.id}">关闭</button>
                    </div>
                `;
                
                if (isSelectMode) {
                    tabDiv.classList.add('select-mode');
                }
                if (selectedTabs.has(tab.id.toString())) {
                    tabDiv.classList.add('selected');
                }

                tabDiv.addEventListener('click', function(e) {
                    if (!isSelectMode || e.target.closest('.tab-actions')) return;
                    
                    const tabId = this.dataset.tabId;
                    this.classList.toggle('selected');
                    if (this.classList.contains('selected')) {
                        selectedTabs.add(tabId);
                    } else {
                        selectedTabs.delete(tabId);
                    }
                    updateSelectedCount();
                });

                tabsContainer.appendChild(tabDiv);
            }

            groupDiv.appendChild(groupHeader);
            groupDiv.appendChild(tabsContainer);
            tabsList.appendChild(groupDiv);
        }

        // 添加书签按钮事件监听
        document.querySelectorAll('.bookmark-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const url = this.getAttribute('data-url');
                const title = this.getAttribute('data-title');
                const isCurrentlyBookmarked = await isBookmarked(url);

                if (isCurrentlyBookmarked) {
                    // 删除书签
                    chrome.bookmarks.search({ url: url }, function(results) {
                        if (results.length) {
                            chrome.bookmarks.remove(results[0].id, function() {
                                loadTabs(); // 重新加载以更新UI
                            });
                        }
                    });
                } else {
                    // 添加书签
                    chrome.bookmarks.create({
                        title: title,
                        url: url
                    }, function() {
                        loadTabs(); // 重新加载以更新UI
                    });
                }
            });
        });

        // 添加事件监听
        document.querySelectorAll('.switch-btn').forEach(button => {
            button.addEventListener('click', function() {
                const tabId = parseInt(this.getAttribute('data-id'));
                chrome.tabs.update(tabId, { active: true });
                chrome.windows.update(tabs.find(t => t.id === tabId).windowId, { focused: true });
            });
        });

        document.querySelectorAll('.close-btn').forEach(button => {
            button.addEventListener('click', function() {
                const tabId = parseInt(this.getAttribute('data-id'));
                chrome.tabs.remove(tabId, function() {
                    loadTabs();
                });
            });
        });

        // 添加组操作事件监听
        document.querySelectorAll('.collapse-btn').forEach(button => {
            button.addEventListener('click', function() {
                const tabsContainer = this.closest('.domain-group').querySelector('.tabs-container');
                tabsContainer.classList.toggle('collapsed');
            });
        });

        document.querySelectorAll('.close-group-btn').forEach(button => {
            button.addEventListener('click', function() {
                const group = this.closest('.domain-group');
                const tabIds = Array.from(group.querySelectorAll('.close-btn'))
                    .map(btn => parseInt(btn.getAttribute('data-id')));
                
                chrome.tabs.remove(tabIds, function() {
                    loadTabs();
                });
            });
        });
    }

    function loadTabs() {
        chrome.tabs.query({}, function(tabs) {
            displayTabs(tabs);
        });
    }

    // 搜索功能
    searchInput.addEventListener('input', function() {
        const searchText = this.value.toLowerCase().trim();
        chrome.tabs.query({}, function(tabs) {
            const filteredTabs = tabs.filter(tab => 
                tab.title.toLowerCase().includes(searchText) || 
                tab.url.toLowerCase().includes(searchText)
            );
            displayTabs(filteredTabs);
        });
    });

    // 初始加载
    loadTabs();
}); 