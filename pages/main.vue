<template>
  <div class="min-h-screen" :class="isDark ? 'bg-dark' : 'bg-gray-50'">
    <div class="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <!-- Stories Section -->
      <div class="overflow-x-auto">
        <div class="flex space-x-4 pb-4">
          <!-- Add Story Card -->
          <div class="flex-shrink-0 w-32 h-48 rounded-xl overflow-hidden relative shadow-sm cursor-pointer group"
            :class="isDark ? 'bg-dark-lighter' : 'bg-white'" @click="openCreateStory">
            <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
            <div
              class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center absolute top-4 left-1/2 transform -translate-x-1/2">
              <Icon name="bi:plus" class="w-6 h-6 text-white" />
            </div>
            <span class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm font-medium">
              Create Story
            </span>
          </div>

          <!-- Story Items -->
          <div v-for="(story, index) in stories" :key="story.id"
            class="flex-shrink-0 w-32 h-48 rounded-xl overflow-hidden relative shadow-sm cursor-pointer"
            @click="openStory(index)">
            <img :src="story.image" class="w-full h-full object-cover" :alt="story.username">
            <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
            <div class="absolute top-4 left-1/2 transform -translate-x-1/2">
              <div class="w-10 h-10 rounded-full border-2 border-blue-500 overflow-hidden">
                <img :src="story.userImage" class="w-full h-full object-cover" :alt="story.username">
              </div>
            </div>
            <span class="absolute bottom-4 left-4 text-white text-sm font-medium">
              {{ story.username }}
            </span>
          </div>
        </div>
      </div>

      <!-- Create Post Section -->
      <div class="rounded-xl shadow-sm p-4 mb-6" :class="isDark ? 'bg-dark-lighter' : 'bg-white'">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <span class="text-xl text-white font-bold">{{ currentUser.icon }}</span>
          </div>
          <input v-model="newPostContent"
            class="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:border-blue-500"
            :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'"
            :placeholder="postPlaceholder" @focus="openCreatePost" />
        </div>
      </div>

      <!-- Story Viewer -->
      <StoryViewer v-if="selectedStoryIndex !== null" :is-open="selectedStoryIndex !== null" :stories="stories"
        :initial-index="selectedStoryIndex" @close="closeStory" />

      <!-- Posts Feed -->
      <div class="space-y-6">
        <div v-for="post in displayedPosts" :key="post.id" class="rounded-xl shadow-sm"
          :class="isDark ? 'bg-dark-lighter' : 'bg-white'">
          <div class="p-4">
            <!-- Post Header -->
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span class="text-white font-bold">{{ post.icon }}</span>
              </div>
              <div>
                <div class="font-semibold">{{ post.username }}</div>
                <div class="text-sm text-gray-500">{{ formatTimeAgo(new Date(post.date)) }}</div>
              </div>
            </div>

            <!-- Post Content -->
            <h1 class="text-xl font-bold mb-4">{{ post.title }}</h1>
            <div class="space-y-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
              <p>{{ post.content }}</p>
              <ImageBox v-if="post.images" class="pt-2" :images="post.images" />
            </div>

            <!-- Tags -->
            <div class="flex flex-wrap gap-2 mt-4">
              <span v-for="tag in post.tags" :key="tag" class="px-3 py-1 rounded-full text-sm"
                :class="isDark ? 'text-blue-400 bg-blue-900/30' : 'bg-blue-50 text-blue-600'">
                #{{ tag }}
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-between mt-4 pt-4 border-t dark:border-gray-800">
              <div class="flex space-x-6">
                <button @click="toggleLike(post)" class="flex items-center space-x-2"
                  :class="post.isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'">
                  <Icon :name="post.isLiked ? 'bi:balloon-heart-fill' : 'bi:balloon-heart'" class="h-5 w-5" />
                  <span>{{ post.likes }}</span>
                </button>
                <button @click="toggleComments(post)" class="flex items-center space-x-2"
                  :class="post.showComments ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'">
                  <Icon name="bi:chat-left-dots" class="w-5 h-5" />
                  <span>{{ post.commentCount }}</span>
                </button>
              </div>
              <button @click="sharePost(post)" class="rounded-full text-gray-500 hover:text-green-500">
                <Icon name="bi:share" class="h-5 w-5" />
              </button>
            </div>

            <!-- Comments Section -->
            <div v-if="post.showComments" class="mt-4 pt-4 border-t dark:border-gray-800">
              <!-- Add Comment -->
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span class="text-sm text-white font-bold">{{ currentUser.icon }}</span>
                </div>
                <div class="flex-1 relative">
                  <input v-model="post.newComment" @keyup.enter="addComment(post)" type="text"
                    placeholder="Add a comment..."
                    class="w-full px-4 py-2 rounded-full border focus:outline-none focus:border-blue-500"
                    :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'" />
                </div>
                <button @click="addComment(post)" class="px-4 py-2 text-blue-500 font-semibold disabled:opacity-50"
                  :disabled="!post.newComment?.trim()">
                  Post
                </button>
              </div>

              <!-- Comments List -->
              <div class="space-y-4">
                <div v-for="comment in post.comments" :key="comment.id" class="relative">
                  <div v-if="!comment.isEditing">
                    <Comment :icon="comment.icon" :username="comment.username" :user-i-d="comment.userID"
                      :date="new Date(comment.date)" :content="comment.content" />
                    <!-- Comment Actions -->
                    <div v-if="comment.userID === currentUser.userID" class="absolute top-4 right-4 flex space-x-2">
                      <button @click="startEdit(comment)"
                        class="px-3 py-1 rounded-full text-sm bg-blue-500 text-white hover:bg-blue-600">
                        Edit
                      </button>
                      <button @click="deleteComment(post, comment)"
                        class="px-3 py-1 rounded-full text-sm bg-red-500 text-white hover:bg-red-600">
                        Delete
                      </button>
                    </div>
                  </div>

                  <!-- Edit Mode -->
                  <div v-else class="bg-gray-50 dark:bg-dark-lighter rounded-xl p-4">
                    <textarea v-model="comment.editContent"
                      class="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-blue-500 min-h-[100px]"
                      :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'"></textarea>
                    <div class="flex justify-end space-x-2 mt-2">
                      <button @click="cancelEdit(comment)"
                        class="px-4 py-2 rounded-full text-sm text-gray-600 hover:text-gray-800">
                        Cancel
                      </button>
                      <button @click="updateComment(post, comment)"
                        class="px-4 py-2 rounded-full text-sm bg-blue-500 text-white hover:bg-blue-600"
                        :disabled="!comment.editContent?.trim()">
                        {{ comment.editContent ? 'Save' : 'Cannot Save Empty' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div v-if="isLoading" class="flex justify-center items-center py-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>

        <!-- Intersection Observer Target -->
        <div ref="infiniteScrollTrigger" class="h-4 w-full"></div>

        <!-- Error Message -->
        <div v-if="error" class="text-center py-4 text-red-500">
          {{ error }}
          <button @click="retryLoading" class="text-blue-500 hover:underline ml-2">
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Add these modals just before closing the main div -->
    <CreateModal v-if="showCreateStory" :is-open="showCreateStory" type="story" @close="showCreateStory = false"
      @submit="handleStorySubmit" />

    <CreateModal v-if="showCreatePost" :is-open="showCreatePost" type="post" @close="showCreatePost = false"
      @submit="handlePostSubmit" />

    <!-- Add ShareModal component -->
    <ShareModal v-if="shareModalPost" :is-open="!!shareModalPost" :post="shareModalPost"
      @close="shareModalPost = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Comment from '~/components/Comment.vue';
import StoryViewer from '~/components/StoryViewer.vue';
import CreateModal from '~/components/CreateModal.vue';
import ShareModal from '~/components/ShareModal.vue';

const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);

interface UserPost {
    id: number;
    icon: string;
    username: string;
    userID: string;
    date: Date; // 確保這裡使用的是正確的 Date 對象
    title: string;
    content: string;
    images?: string[];
    tags?: string[];
    likes?: number;
    commentCount: number;
    isLiked?: boolean;
    showComments: boolean;
    newComment: string;
    comments: Comment[];
}

// Mock current user data
const currentUser = ref({
  icon: 'M',
  username: 'MyUser',
  userID: 'myuser123'
});

// Add a reactive timestamp to force updates
const currentTimestamp = ref(Date.now());

// Update timestamp every second
onMounted(() => {
  const interval = setInterval(() => {
    console.log('Updating timestamp:', Date.now());
    currentTimestamp.value = Date.now();
  }, 1000);

  onUnmounted(() => {
    clearInterval(interval);
  });
});

// Initial posts data with proper date objects
const initialPosts:UserPost[] = [
  {
    id: 1,
    icon: '🌟',
    username: 'TechEnthusiast',
    userID: 'tech_enthusiast',
    date: new Date(), // 確保這裡使用的是正確的 Date 對象
    title: 'Amazing Technology',
    content: 'Exploring the latest tech innovations!',
    images: [
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/601',
      'https://picsum.photos/800/602'
    ],
    tags: ['technology', 'innovation', 'future'],
    likes: 156,
    commentCount: 0,
    isLiked: false,
    showComments: false,
    newComment: '',
    comments: []
  },
  {
    id: 2,
    icon: '🎨',
    username: 'ArtisticSoul',
    userID: 'artistic_soul',
    date: new Date('2024-01-16'),
    title: 'Creative Journey',
    content: 'Sharing my latest artwork with everyone!',
    images: ['https://picsum.photos/800/603'],
    tags: ['art', 'creativity', 'inspiration'],
    likes: 89,
    commentCount: 0,
    isLiked: false,
    showComments: false,
    newComment: '',
    comments: []
  }
];

// Infinite scroll related refs
const infiniteScrollTrigger = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const page = ref(1);
const hasMore = ref(true);
const displayedPosts = ref(initialPosts); // Initialize with initial posts
const error = ref<string | null>(null);

// Add stories data
const stories = ref([
  {
    id: 1,
    username: 'TechEnthusiast',
    userImage: 'https://picsum.photos/100/100?random=1',
    image: 'https://picsum.photos/400/600?random=1',
  },
  {
    id: 2,
    username: 'ArtisticSoul',
    userImage: 'https://picsum.photos/100/100?random=2',
    image: 'https://picsum.photos/400/600?random=2',
  },
  {
    id: 3,
    username: 'TravelBug',
    userImage: 'https://picsum.photos/100/100?random=3',
    image: 'https://picsum.photos/400/600?random=3',
  },
  {
    id: 4,
    username: 'FoodLover',
    userImage: 'https://picsum.photos/100/100?random=4',
    image: 'https://picsum.photos/400/600?random=4',
  },
]);

// Add placeholder text state
const postPlaceholder = ref("What's on your mind?");

// Add new refs
const selectedStoryIndex = ref(null);
const newPostContent = ref('');
const showCreateStory = ref(false);
const showCreatePost = ref(false);

// Add new ref for share modal
const shareModalPost = ref(null);

// Function to handle create post
const openCreatePost = () => {
  showCreatePost.value = true;
};

// Toggle like on a post
const toggleLike = (post: any) => {
  post.isLiked = !post.isLiked;
  post.likes += post.isLiked ? 1 : -1;
};

// Toggle comments visibility
const toggleComments = (post: any) => {
  post.showComments = !post.showComments;
};

// Enhanced comment interface
interface Comment {
  id: number;
  icon: string;
  username: string;
  userID: string;
  date: Date;
  content: string;
  isEditing: boolean;
  editContent: string;
}

// Start editing a comment
const startEdit = (comment: Comment) => {
  comment.isEditing = true;
  comment.editContent = comment.content;
};

// Cancel comment editing
const cancelEdit = (comment: Comment) => {
  comment.isEditing = false;
  comment.editContent = '';
};

// Update a comment
const updateComment = async (post: any, comment: Comment) => {
  try {
    console.log('Updating comment:', comment.id);
    console.log('New content:', comment.editContent);

    if (!comment.editContent?.trim()) return;

    // 在實際應用中，這裡會是一個 API 調用
    // const response = await fetch(`/api/posts/${post.id}/comments/${comment.id}`, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ content: comment.editContent.trim() }),
    // });

    // 更新評論內容
    comment.content = comment.editContent.trim();
    comment.isEditing = false;
    comment.editContent = '';

    console.log('Comment updated successfully:', comment.content);
  } catch (error) {
    console.error('Error updating comment:', error);
  }
};

// Delete a comment
const deleteComment = async (post: any, comment: Comment) => {
  if (!confirm('Are you sure you want to delete this comment?')) return;

  try {
    console.log('Deleting comment:', comment.id);
    console.log('Current comments:', post.comments);

    const commentIndex = post.comments.findIndex((c: any) => c.id === comment.id);
    console.log('Comment index:', commentIndex);

    if (commentIndex !== -1) {
      post.comments.splice(commentIndex, 1);
      post.commentCount--;
      console.log('Comments after deletion:', post.comments);
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
};

// Modified addComment function
const addComment = (post: any) => {
  if (!post.newComment?.trim()) return;

  const comment: Comment = {
    id: Date.now(),
    icon: currentUser.value.icon,
    username: currentUser.value.username,
    userID: currentUser.value.userID,
    date: new Date(),
    content: post.newComment.trim(),
    isEditing: false,
    editContent: ''
  };

  console.log('Adding new comment:', comment);
  post.comments.unshift(comment);
  post.commentCount++;
  post.newComment = '';
};

// Mock function to fetch more posts
const fetchMorePosts = async (pageNumber: number) => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return Array(5).fill(null).map((_, index) => ({
    id: Date.now() + index,
    icon: '📝',
    username: `User${pageNumber}_${index}`,
    userID: `user${pageNumber}_${index}`,
    date: new Date(), // Use current date for new posts
    title: `Post ${pageNumber}.${index}`,
    content: `This is post content for ${pageNumber}.${index}`,
    images: [`https://picsum.photos/800/${600 + index}`],
    tags: ['tag1', 'tag2'],
    likes: Math.floor(Math.random() * 100),
    commentCount: 0,
    isLiked: false,
    showComments: false,
    newComment: '',
    comments: []
  }));

};

// Setup intersection observer
const setupInfiniteScroll = () => {
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
  };

  const observer = new IntersectionObserver(async (entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore.value && !isLoading.value) {
      try {
        isLoading.value = true;
        const newPosts = await fetchMorePosts(page.value);
        displayedPosts.value = [...displayedPosts.value, ...newPosts];
        page.value++;
      } catch (error) {
        console.error('Error loading more posts:', error);
      } finally {
        isLoading.value = false;
      }
    }
  }, options);

  if (infiniteScrollTrigger.value) {
    observer.observe(infiniteScrollTrigger.value);
  }

  return observer;
};

// Lifecycle hooks
onMounted(() => {
  // 設置無限滾動
  const observer = setupInfiniteScroll();

  // Update times every minute
  const timeUpdateInterval = window.setInterval(() => {
    // Force a re-render of the component
    displayedPosts.value = [...displayedPosts.value];
  }, 60000); // Update every minute

  // 清理函數
  onUnmounted(() => {
    if (infiniteScrollTrigger.value) {
      observer.unobserve(infiniteScrollTrigger.value);
    }
    // Clear the interval when component is unmounted
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval);
    }
  });
});

// Error handling
const retryLoading = () => {
  // Implement retry logic here
  console.log('Retrying loading...');
};

// Format time ago function
const formatTimeAgo = (date: Date) => {
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }

  const years = Math.floor(diffInDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

const isValidDate = (date: any) => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Add new methods
const openStory = (index:any) => {
  selectedStoryIndex.value = index;
};

const closeStory = () => {
  selectedStoryIndex.value = null;
};

const openCreateStory = () => {
  showCreateStory.value = true;
};

// Add new methods for handling submissions
const handleStorySubmit = async (formData: FormData) => {
  try {
    // Here you would typically make an API call to save the story
    console.log('Submitting story:', formData);

    // Mock story creation
    const newStory = {
      id: Date.now(),
      username: currentUser.value.username,
      userImage: `https://picsum.photos/100/100?random=${stories.value.length + 1}`,
      image: URL.createObjectURL(formData.get('image') as File),
    };

    stories.value.unshift(newStory);
  } catch (error) {
    console.error('Error creating story:', error);
  }
};

const handlePostSubmit = async (formData: FormData) => {
  try {
    // Here you would typically make an API call to save the post
    console.log('Submitting post:', formData);

    // Mock post creation
    const newPost:UserPost = {
      id: Date.now(),
      icon: currentUser.value.icon,
      username: currentUser.value.username,
      userID: currentUser.value.userID,
      date: new Date(),
      title: formData.get('title')?.toString()??"",
      content: formData.get('content')?.toString()??"",
      images: [URL.createObjectURL(formData.get('image') as File)],
      tags: [],
      likes: 0,
      commentCount: 0,
      isLiked: false,
      showComments: false,
      newComment: '',
      comments: []
    };

    displayedPosts.value.unshift(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
  }
};

// Add share function
const sharePost = (post:any) => {
  shareModalPost.value = post;
};
</script>

<style scoped>
/* Add smooth transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Loading spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Add horizontal scrollbar styling */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}
</style>