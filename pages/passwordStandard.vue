<script lang="ts" setup>

const route = useRoute()
const {data:page} = await useAsyncData(route.path,()=>{
    return queryCollection("content").path("/passwordStandard").first()
})
// console.log(route.path);
// console.log(page);
//


</script>
<template>
    <div>
        <ContentRenderer v-if="page" :value="page" />
    </div>

</template>