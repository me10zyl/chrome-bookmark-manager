import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

const PREFIX = '[TabGroup]';
export const clickBtn = async (id: string) => {
    console.log('clickBtn')
    let tabs = await chrome.tabs.query({});
    let url = `index.html#/${id}`;
    let existsTabs = tabs.filter(e=>e.url === chrome.runtime.getURL(url));
    if(existsTabs.length > 0){
        console.log('activeTab', existsTabs[0].id)
        await chrome.windows.update(existsTabs[0].windowId, {
            focused: true
        })
        await chrome.tabs.update(existsTabs[0].id, {
            active: true
        })
    }else {
        await chrome.tabs.create({
            url: url,
            active: true
        })
    }
}
export function addToGroup(groupName: string, selectedTabs:string[], successCallback?:()=>{}) {
    // 确保根文件夹存在
    function ensureRootFolder(title: string, parentId: string): Promise<BookmarkTreeNode> {
        return new Promise((resolve) => {
            chrome.bookmarks.search({title: title}, function (results) {
                if (results.length > 0) {
                    // 如果找到了根文件夹，直接返回
                    resolve(results[0]);
                } else {
                    // 如果没找到，创建一个新的根文件夹
                    chrome.bookmarks.create({
                        title: title,
                        parentId: parentId  // 在书签栏中创建
                    }, resolve);
                }
            });
        });
    }

    // 首先确保有一个根文件夹
    ensureRootFolder('我的标签组', '1').then((rootFolder: BookmarkTreeNode) => {
        // 在根文件夹下创建新的书签组
        ensureRootFolder(`[TabGroup]${groupName}`,
            rootFolder.id
        ).then(function (folder) {
            chrome.tabs.query({}, function (tabs) {
                const selectedTabsInfo = tabs.filter(tab => selectedTabs.includes(tab.id.toString()));
                Promise.all(selectedTabsInfo.map(tab => {
                    return new Promise((resolve) => {
                        chrome.bookmarks.create({
                            parentId: folder.id,
                            title: tab.title,
                            url: tab.url
                        }, resolve);
                    });
                })).then(() => {
                    if(successCallback){
                        successCallback()
                    }
                });
            });
        });
    });
}

export const removeFromBookmarkGroup = async (url: string) => {
    try {
        console.log('removeFromBookmarkGroup')
        const bookmarkGroups = await fetchBookmarkGroups();
        const bookmarkGroup = bookmarkGroups.find(group =>
            group.children.some(child => child.url === url)
        );

        if (bookmarkGroup) {
            const bookmark = bookmarkGroup.children.find(child => child.url === url);
            await chrome.bookmarks.remove(String(bookmark.id));
            console.log('从书签组中移除成功:', bookmark);
        }
    } catch (error) {
        console.error('从书签组中移除失败:', error);
    }
}

export const fetchBookmarkGroups  = ():Promise<BookmarkTreeNode[]> => {
    return new Promise((r) => {
        chrome.bookmarks.search({title: '我的标签组'}, function (results) {
            if (results.length === 0) {
                return;
            }

            chrome.bookmarks.getChildren(results[0].id, function (children) {
                const bookmarkGroups = children.filter(child =>
                    child.title.startsWith(PREFIX)
                ).map(group => {
                    //@ts-ignore
                    group.displayTitle = group.title.replace(PREFIX, '');
                    return group;
                });

                Promise.all(bookmarkGroups.map(group =>
                    new Promise(resolve => {
                        chrome.bookmarks.getChildren(group.id, children => {
                            group.children = children;
                            resolve(group);
                        });
                    })
                )).then((groups) => {
                    //@ts-ignore
                    r(groups)
                });
            });
        });
    })
}

export const updateGroupName = async (groupId, newTitle) => {
    try {
        newTitle = PREFIX + newTitle;
        await chrome.bookmarks.update(String(groupId), {title: newTitle})
    } catch (error) {
        console.error('更新书签组名称失败:', error)
        alert('更新失败，请重试')
    }
}