<script lang="ts" setup>
const route = useRoute()
const { data: page } = await useAsyncData(route.path, async () => {
    return await queryCollection("content").path("/password_standard").first()
})

// 更好的调试方式
console.log('Current path:', route.path)
console.log('Page data:', page.value)
</script>

<template>
    <div class="flex justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div class="w-full max-w-3xl py-12">
            <ContentRenderer v-if="page" :value="page" class="                        
            prose-headings:mt-8        
            prose-headings:mb-4
            prose-headings:font-semibold
            prose-h1:text-3xl sm:prose-h1:text-4xl
            prose-h2:text-2xl sm:prose-h2:text-3xl
            prose-h3:text-xl sm:prose-h3:text-2xl
            prose-a:text-blue-600 hover:prose-a:text-blue-800
            prose a:no-underline hover:prose a:underline
            prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
            prose-pre:bg-gray-800 prose-pre:text-gray-100
            prose-img:rounded-lg prose-img:shadow-md
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500
            prose-blockquote:bg-gray-100 prose-blockquote:px-4
            prose-p:my-4 prose-p:leading-7 sm:prose-p:leading-8
            prose-li:my-1                      
            prose-blockquote:my-6      
            prose-pre:my-6             
            dark:prose-invert
            dark:prose-code:bg-gray-700
            dark:prose-pre:bg-gray-900 dark:prose-pre:text-gray-200
            dark:prose-blockquote:bg-gray-800
            mx-auto
          " />
            <div v-else class="text-center p-8 text-red-500 dark:text-red-400 text-lg font-medium">
                Page not found or loading...
            </div>
        </div>
    </div>
</template>
<style scoped>
/* 讓 prose 影響 ContentRenderer 內部 */
::v-deep(.prose) {
  font-size: 1rem;
  line-height: 1.75;
  max-width: 65ch; /* prose 預設的內容寬度 */
  color: inherit;
}

/* 標題樣式 */
::v-deep(.prose h1) {
  font-size: 1.875rem; /* text-3xl */
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
}
::v-deep(.prose h2) {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
}
::v-deep(.prose h3) {
  font-size: 1.25rem; /* text-xl */
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

/* 段落和列表 */
::v-deep(.prose p) {
  margin: 1rem 0;
  line-height: 1.75;
}
::v-deep(.prose li) {
  margin: 0.25rem 0;
}

/* 連結樣式 */
::v-deep(.prose a) {
  color: #2563eb; /* text-blue-600 */
  text-decoration: none;
}
::v-deep(.prose a:hover) {
  color: #1e40af; /* hover:text-blue-800 */
  text-decoration: underline;
}

/* 代碼區塊 */
/* 一般模式：代碼區塊 */
::v-deep(.prose pre) {
  background-color: #1f2937; /* bg-gray-800 */
  color: #f9fafb; /* text-gray-100 */
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1.5rem 0;
  overflow-x: auto;
}

/* 確保 pre 內的 code 文字可見 */
::v-deep(.prose pre code) {
  color: #e5e7eb !important; /* text-gray-200 */
}
/* 引用區塊 */
::v-deep(.prose blockquote) {
  border-left: 4px solid #3b82f6; /* border-blue-500 */
  background-color: #f3f4f6; /* bg-gray-100 */
  padding: 0.5rem 1rem;
  margin: 1.5rem 0;
  font-style: italic;
}

/* 深色模式 */
.dark ::v-deep(.prose pre) {
  background-color: #111827; /* bg-gray-900 */
  color: #e5e7eb; /* text-gray-200 */
}
.dark ::v-deep(.prose pre code) {
  color: #d1d5db !important; /* text-gray-300 */
}
.dark ::v-deep(.prose blockquote) {
  background-color: #1f2937; /* bg-gray-800 */
}
</style>
