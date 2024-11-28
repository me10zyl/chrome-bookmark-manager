document.addEventListener('DOMContentLoaded', function() {
  const openManagerButton = document.getElementById('openManager');
  const openTabsButton = document.getElementById('openTabs');
  const openGroupsButton = document.getElementById('openGroups');
  const openSearchButton = document.getElementById('openSearch');
  
  openManagerButton.addEventListener('click', function() {
    chrome.tabs.create({
      url: 'bookmarks.html'
    });
  });
  
  openTabsButton.addEventListener('click', function() {
    chrome.tabs.create({
      url: 'tabs.html'
    });
  });
  
  openGroupsButton.addEventListener('click', function() {
    chrome.tabs.create({
      url: 'bookmark-groups.html'
    });
  });
  
  openSearchButton.addEventListener('click', function() {
    chrome.tabs.create({
      url: 'search.html',
      active: true
    });
  });
}); 