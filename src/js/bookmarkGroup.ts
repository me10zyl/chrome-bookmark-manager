import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

const PREFIX = '[TabGroup]';

export const removeFromBookmarkGroup = async (url: string) => {
    try {
        const bookmarkGroups = await fetchBookmarkGroups();
        const bookmarkGroup = bookmarkGroups.find(group =>
            group.children.some(child => child.url === url)
        );

        if (bookmarkGroup) {
            const bookmark = bookmarkGroup.children.find(child => child.url === url);
            await chrome.bookmarks.remove(String(bookmark.id));
        }
    } catch (error) {
        console.error('从书签组中移除失败:', error);
        alert('从书签组中移除失败，请重试')
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