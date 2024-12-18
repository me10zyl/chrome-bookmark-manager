<template>
  <button class="dropdown-item" >
      <slot></slot>
  </button>
</template>
<script>
export default {
  name: 'DropdownItem'
}
</script>
<style scoped>
/* 保持原有的 CSS 样式不变 */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  margin: 0;
  padding: 20px;
  background: #f5f5f5;
}

.group-edit-form input {
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 6px;
  padding: 5px 40px 5px 16px;
  border-radius: 8px;
  box-sizing: border-box;
  outline: none;
  border: none;
}

.bookmark-item a {
  display: flex;
  flex-direction: column;
  color: #3c4043;
  text-decoration: none;
  gap: 4px;
}

.empty-state p {
  margin: 8px 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 下拉菜单相关样式 */


.edit-group-btn svg {
  fill: #444;
  width: 18px;
  height: 18px;
  transition: fill 0.2s ease;
}

.edit-group-btn:hover svg {
  fill: #1a73e8;
}

::v-deep(.dropdown-menu) {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 180px;
  padding: 8px 0;
  margin-top: 4px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s ease;
  z-index: 1000;
}

::v-deep(.dropdown-menu.show) {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

::v-deep(.dropdown-item) {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  color: #202124;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item svg {
  width: 16px;
  height: 16px;
  margin-right: 12px;
  fill: #5f6368;
}

.dropdown-item:hover svg {
  fill: #1a73e8;
}

/* 书签组样式 */


</style>