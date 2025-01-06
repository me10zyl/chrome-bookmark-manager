<script setup lang="ts">

import {MessageRequest} from "@/js/commonDeclare";
import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
import {ref} from "vue";

const groups = ref<BookmarkTreeNode[]>();
chrome.runtime.onMessage.addListener( (request :MessageRequest, sender, sendResponse)=>{
  switch (request.action) {
    case 'addToBookmarkGroup':
      console.log('addToBookmarkGroup', request.data);
      break;
    case 'removeFromBookmarkGroup':
      break;
  }
})
</script>

<template>
  <div v-for="group in groups">
      <div class="group">
        <div class="group-title">
          {{group.displayTitle}}
        </div>
      </div>
  </div>
</template>

<style scoped>

</style>