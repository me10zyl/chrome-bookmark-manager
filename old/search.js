document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchStats = document.getElementById('searchStats');

    // 检查必要的DOM元素是否存在
    if (!searchInput || !searchResults || !searchStats) {
        console.error('找不到必要的DOM元素');
        return;
    }

    let searchTimeout;

    // 搜索配置
    const CONFIG = {
        maxResults: {
            tabs: 5,        // 默认显示5个最近的标签页
            bookmarks: 5,   // 默认显示5个最近的书签
            history: 5      // 默认显示5个最近的历史记录
        },
        preview: {
            maxLength: 150,  // 预览文本最大长度
            enabled: true    // 是否启用预览
        },
        minQueryLength: 2,
        debounceTime: 200
    };

    // 防抖函数
    function debounce(func, wait) {
        return function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => func.apply(this, arguments), wait);
        };
    }

    // 搜索函数
    async function performSearch(query) {
        try {
            // 清空之前的结果
            if (searchResults && searchStats) {
                searchResults.innerHTML = '<div class="loading">搜索中...</div>';
                searchStats.innerHTML = '';
            }

            // 检查搜索词长度
            if (query.length < CONFIG.minQueryLength) {
                if (searchResults) {
                    searchResults.innerHTML = `
                        <div class="no-results">
                            <p>请输入至少 ${CONFIG.minQueryLength} 个字符</p>
                        </div>
                    `;
                }
                return;
            }

            // 分别处理每个搜索源，如果某个搜索失败不影响其他搜索
            const [tabs, bookmarks, historyItems] = await Promise.all([
                searchTabs(query).catch(err => {
                    console.error('标签页搜索错误:', err);
                    return [];
                }),
                searchBookmarks(query).catch(err => {
                    console.error('书签搜索错误:', err);
                    return [];
                }),
                searchHistory(query).catch(err => {
                    console.error('历史记录搜索错误:', err);
                    return [];
                })
            ]);

            displayResults(tabs || [], bookmarks || [], historyItems || []);
        } catch (error) {
            console.error('搜索错误:', error);
            if (searchResults) {
                searchResults.innerHTML = '<div class="error">搜索出错，请重试</div>';
            }
        }
    }

    // 搜索标签页
    function searchTabs(query) {
        return new Promise((resolve, reject) => {
            try {
                chrome.tabs.query({}, (tabs) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    const queryLower = query.toLowerCase();
                    const results = tabs
                        .filter(tab => 
                            (tab.title?.toLowerCase().includes(queryLower) ||
                            tab.url?.toLowerCase().includes(queryLower))
                        )
                        .slice(0, CONFIG.maxResults.tabs);
                    resolve(results);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    // 搜索书签
    function searchBookmarks(query) {
        return new Promise((resolve, reject) => {
            try {
                chrome.bookmarks.search(query, (results) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    const bookmarks = results
                        .filter(item => item.url)
                        .slice(0, CONFIG.maxResults.bookmarks);
                    resolve(bookmarks);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    // 搜索历史记录
    function searchHistory(query) {
        return new Promise((resolve, reject) => {
            try {
                if (!chrome.history) {
                    console.warn('历史记录API不可用');
                    resolve([]);
                    return;
                }

                chrome.history.search({
                    text: query,
                    maxResults: CONFIG.maxResults.history,
                    startTime: Date.now() - (30 * 24 * 60 * 60 * 1000) // 最近30天
                }, (results) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    resolve(results);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    // 显示结果
    function displayResults(tabs, bookmarks, historyItems) {
        const totalResults = tabs.length + bookmarks.length + historyItems.length;
        
        if (searchStats) {
            searchStats.innerHTML = `找到 ${totalResults} 个结果`;
        }

        if (totalResults === 0) {
            if (searchResults) {
                searchResults.innerHTML = `
                    <div class="no-results">
                        <p>未找到相关结果</p>
                    </div>
                `;
            }
            return;
        }

        let html = '';

        // 显示标签页结果
        if (tabs.length > 0) {
            html += createResultGroup('打开的标签页', tabs, 'tab');
        }

        // 显示书签结果
        if (bookmarks.length > 0) {
            html += createResultGroup('书签', bookmarks, 'bookmark');
        }

        // 显示历史记录结果
        if (historyItems.length > 0) {
            html += createResultGroup('历史记录', historyItems, 'history');
        }

        if (searchResults) {
            searchResults.innerHTML = html;
        }
        addResultListeners();
    }

    // 创建结果组
    function createResultGroup(title, items, type) {
        return `
            <div class="result-group">
                <div class="group-header">${title} (${items.length})</div>
                <div class="group-items">
                    ${items.map(item => createResultItem(item, type)).join('')}
                </div>
            </div>
        `;
    }

    // 创建结果项HTML
    function createResultItem(item, type) {
        const typeLabels = {
            tab: '标签页',
            bookmark: '书签',
            history: '历史'
        };

        const favicon = type === 'tab' ? 
            (item.favIconUrl || 'chrome://favicon/') : 
            `chrome://favicon/${item.url}`;

        const title = item.title || '无标题';
        const url = item.url || '#';

        return `
            <div class="result-item" data-type="${type}" data-id="${item.id}" data-url="${url}">
                <img class="result-icon" src="${favicon}">
                <div class="result-info">
                    <div class="result-title">${title}</div>
                    <div class="result-url">${url}</div>
                </div>
                <span class="result-type type-${type}">${typeLabels[type]}</span>
            </div>
        `;
    }

    // 添加结果项点击事件
    function addResultListeners() {
        document.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('click', function() {
                const type = this.dataset.type;
                const id = this.dataset.id;
                const url = this.dataset.url;

                switch(type) {
                    case 'tab':
                        chrome.tabs.update(parseInt(id), { active: true });
                        chrome.windows.update(parseInt(this.dataset.windowId), { focused: true });
                        break;
                    case 'bookmark':
                    case 'history':
                        chrome.tabs.create({ url: url });
                        break;
                }
            });
        });
    }

    // 只有在所有元素都存在的情况下才添加事件监听
    if (searchInput) {
        // 监听输入
        searchInput.addEventListener('input', debounce(function() {
            const query = this.value.trim();
            
            if (query) {
                // 有搜索词时执行搜索
                performSearch(query);
            } else {
                // 搜索词为空时显示默认预览
                showDefaultContent();
            }
        }, CONFIG.debounceTime));

        // 监听键盘事件
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                // ESC键清空输入并显示默认预览
                this.value = '';
                showDefaultContent();
            } else if (e.key === 'Enter') {
                // Enter键处理第一个结果
                const firstResult = document.querySelector('.result-item');
                if (firstResult) {
                    firstResult.click();
                }
            }
        });

        // 自动聚焦搜索框
        searchInput.focus();
    }

    // 页面加载时显示默认内容
    showDefaultContent();

    // 显示默认内容
    async function showDefaultContent() {
        searchResults.innerHTML = '<div class="loading">加载中...</div>';
        
        try {
            const [recentTabs, recentBookmarks, recentHistory] = await Promise.all([
                getRecentTabs(),
                getRecentBookmarks(),
                getRecentHistory()
            ]);

            displayDefaultResults(recentTabs, recentBookmarks, recentHistory);
        } catch (error) {
            console.error('加载默认内容错误:', error);
            searchResults.innerHTML = '<div class="error">加载失败，请重试</div>';
        }
    }

    // 获取最近的标签页
    function getRecentTabs() {
        return new Promise((resolve) => {
            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                resolve(tabs.slice(0, CONFIG.maxResults.tabs));
            });
        });
    }

    // 获取最近的书签
    function getRecentBookmarks() {
        return new Promise((resolve) => {
            chrome.bookmarks.getRecent(CONFIG.maxResults.bookmarks, (bookmarks) => {
                resolve(bookmarks);
            });
        });
    }

    // 获取最近的历史记录
    function getRecentHistory() {
        return new Promise((resolve) => {
            if (!chrome.history) {
                resolve([]);
                return;
            }
            chrome.history.search({
                text: '',
                maxResults: CONFIG.maxResults.history,
                startTime: 0
            }, (history) => {
                resolve(history);
            });
        });
    }

    // 显示默认结果
    function displayDefaultResults(tabs, bookmarks, history) {
        let html = '<div class="default-content">';
        
        // 显示最近的标签页
        if (tabs.length > 0) {
            html += `
                <div class="section">
                    <div class="section-header">
                        <h2>当前标签页</h2>
                        <span class="section-count">${tabs.length}个标签页</span>
                    </div>
                    <div class="section-content">
                        ${tabs.map(tab => createTabCard(tab)).join('')}
                    </div>
                </div>
            `;
        }

        // 显示最近的书签
        if (bookmarks.length > 0) {
            html += `
                <div class="section">
                    <div class="section-header">
                        <h2>最近添加的书签</h2>
                        <span class="section-count">${bookmarks.length}个书签</span>
                    </div>
                    <div class="section-content">
                        ${bookmarks.map(bookmark => createBookmarkCard(bookmark)).join('')}
                    </div>
                </div>
            `;
        }

        // 显示最近的历史记录
        if (history.length > 0) {
            html += `
                <div class="section">
                    <div class="section-header">
                        <h2>最近访问</h2>
                        <span class="section-count">${history.length}个记录</span>
                    </div>
                    <div class="section-content">
                        ${history.map(item => createHistoryCard(item)).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        searchResults.innerHTML = html;
        addDefaultListeners();
    }

    // 创建标签页卡片
    function createTabCard(tab) {
        return `
            <div class="card tab-card" data-tab-id="${tab.id}">
                <div class="card-header">
                    <img class="card-favicon" src="${tab.favIconUrl || 'chrome://favicon/'}" 
                         onerror="this.src='chrome://favicon/'">
                    <div class="card-title">${tab.title}</div>
                </div>
                <div class="card-url">${tab.url}</div>
                <div class="card-actions">
                    <button class="card-btn switch-btn" title="切换到此标签页">切换</button>
                    <button class="card-btn close-btn" title="关闭标签页">关闭</button>
                </div>
            </div>
        `;
    }

    // 创建书签卡片
    function createBookmarkCard(bookmark) {
        return `
            <div class="card bookmark-card" data-url="${bookmark.url}">
                <div class="card-header">
                    <img class="card-favicon" src="chrome://favicon/${bookmark.url}">
                    <div class="card-title">${bookmark.title}</div>
                </div>
                <div class="card-url">${bookmark.url}</div>
                <div class="card-actions">
                    <button class="card-btn open-btn" title="打开书签">打开</button>
                    <button class="card-btn delete-btn" title="删除书签">删除</button>
                </div>
            </div>
        `;
    }

    // 创建历史记录卡片
    function createHistoryCard(historyItem) {
        const date = new Date(historyItem.lastVisitTime);
        return `
            <div class="card history-card" data-url="${historyItem.url}">
                <div class="card-header">
                    <img class="card-favicon" src="chrome://favicon/${historyItem.url}">
                    <div class="card-title">${historyItem.title}</div>
                </div>
                <div class="card-url">${historyItem.url}</div>
                <div class="card-meta">
                    访问次数: ${historyItem.visitCount || 1} • 
                    最后访问: ${date.toLocaleString()}
                </div>
                <div class="card-actions">
                    <button class="card-btn open-btn" title="打开页面">打开</button>
                </div>
            </div>
        `;
    }

    // 添加默认事件监听
    function addDefaultListeners() {
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', function() {
                const action = this.id;

                switch(action) {
                    case 'openAllTabs':
                        openAllTabs();
                        break;
                    case 'closeOtherTabs':
                        closeOtherTabs();
                        break;
                    case 'groupTabs':
                        groupTabs();
                        break;
                    case 'clearHistory':
                        clearHistory();
                        break;
                }
            });
        });
    }

    // 打开所有标签页
    function openAllTabs() {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            tabs.forEach(tab => chrome.tabs.update(tab.id, { active: true }));
        });
    }

    // 关闭其他标签页
    function closeOtherTabs() {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            const activeTabId = tabs.find(tab => tab.active).id;
            tabs.forEach(tab => {
                if (tab.id !== activeTabId) {
                    chrome.tabs.update(tab.id, { active: false });
                }
            });
        });
    }

    // 标签页分组
    function groupTabs() {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            const groupedTabs = tabs.reduce((groups, tab) => {
                const groupName = tab.title.split(' ')[0];
                if (!groups[groupName]) {
                    groups[groupName] = [];
                }
                groups[groupName].push(tab);
                return groups;
            }, {});

            Object.keys(groupedTabs).forEach(groupName => {
                chrome.tabs.group({
                    tabIds: groupedTabs[groupName].map(tab => tab.id)
                });
            });
        });
    }

    // 清理历史记录
    function clearHistory() {
        chrome.history.deleteAll(({ urls: [] }));
    }
}); 