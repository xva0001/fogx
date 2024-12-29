<template>
    <div :class="isDark ? 'text-gray-100 bg-dark' : 'bg-gray-50 text-gray-900'" class="min-h-screen">
        <div class="max-w-2xl mx-auto p-4">
            <!-- TOP HEADER -->
            <header class="sticky rounded-md top-0 z-50 backdrop-blur-sm theme-transition mb-4"
                :class="isDark ? 'text-gray-100 bg-dark border-gray-800' : 'bg-gray-50 text-gray-900 border-gray-200'">
                <div class="flex items-center justify-between p-4">
                    <button class="flex items-center space-x-2  " :class="isDark ? 'text-gray-200' : 'text-gray-700'">
                        <Icon name="bi:arrow-left-short" />
                        <span>Back</span>
                    </button>

                    <DarkModeBtn />
                </div>
            </header>

            <Post :icon="postObj.icon" :username="postObj.username"
            :user-i-d="postObj.userID" :date="postObj.date" 
            :title="postObj.title" :content="postObj.content"
            :images="postObj.images" :tags="postObj.tags" :like="postObj.like"
            :comments="postObj.comments" />
            <!-- COMMENTS SECTION -->
            <div class="mt-6">
                <h2 class="text-xl font-bold mb-4">Comments</h2>
                <div class=" rounded-xl shadow-sm p-4 mb-4" :class="isDark ? ' bg-gray-800/30' : 'bg-white'">
                    <textarea class="w-full px-4 py-3 rounded-xl 
                        focus:ring-2
                      focus:ring-blue-500 
                        focus:border-transparent"
                        :class="isDark ? ' border-gray-700 text-gray-200' : 'bg-gray-50 bg-dark border border-gray-200 '"
                        rows="4" placeholder="Share your thoughts..."></textarea>
                    <button
                        class="mt-3 px-4 py-2 flex items-center space-x-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                        <Icon name="bi:box-arrow-in-up" class="h-5 w-5" />
                        <span>Post</span>
                    </button>

                </div>
                
                <template v-for="comment in arrComment">

                    <Comment :icon="comment.icon" :username="comment.username" :user-i-d="comment.userID" :date="comment.date" :content="comment.content" />

                </template>


            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);
const images :string[] = [];
images.push("https://i.imgur.com/U7ypdLo.png")
images.push("https://i.imgur.com/OTddyRe.gif")
images.push("https://truth.bahamut.com.tw/s01/202409/deccee215c1309bea22bbec726812442.JPG")


const icon = "J"

const tags = ["Design", "UI/UX","WebDev"]

const postObj = {
    icon : icon,
    username :'John Doe',
    userID: "johndoe",
    date:new Date(2024,11,27),
    title : "Test Post",
    content : "Hi \n We are msgfog team",
    images : images,
    tags:tags,
    like: 65536,
    comments:1
}

const commentObj = {
    icon: "S",
    username:"Sarah Kim",
    userID: "sarahkim123456",
    date : new Date(2024,11,29),
    content:"Great!"
}
const arrComment = [commentObj,commentObj,commentObj]


</script>
