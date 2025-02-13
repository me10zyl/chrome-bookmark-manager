// 格式化时间差
export const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '未知时间';
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 60) return `${seconds} 秒前`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
    return `${Math.floor(seconds / 86400)} 天前`;
}

export const typeLabels = {
    tab: '标签页',
    bookmark: '书签',
    history: '历史'
};
