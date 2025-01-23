<!-- components/Sidebar.vue -->
<template>
  <div
    @mouseenter="setExpanded(true)"
    @mouseleave="setExpanded(false)"
    :class="[
      'fixed left-0 top-0 h-screen transition-all duration-500 ease-in-out z-30',
      'bg-base-100'
    ]"
    :style="{
      width: expanded ? '16rem' : '4rem'
    }"
  >
    <!-- Logo Area -->
    <div class="px-3 py-4">
      <div class="flex items-center">
        <div class="min-w-8 h-8 flex items-center">
          <img src="~/assets/logo/logo_dark.svg" alt="MsgFog" class="h-8 w-8" />
        </div>
        <div class="overflow-hidden">
          <span 
            :class="[
              'ml-3 text-lg font-semibold whitespace-nowrap transition-all duration-500',
              expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            ]"
          >
            MsgFog
          </span>
        </div>
      </div>
    </div>

    <!-- Main Navigation -->
    <nav class="px-2 mt-4">
      <ul class="space-y-2">
        <li v-for="item in items" :key="item.key || item.label" class=" cursor-pointer">
          <a
            @click.prevent="handleItemClick(item)"
            :class="[
              'flex items-center rounded-xl px-3 py-3 transition-all duration-200',
              'hover:bg-base-200 text-base-content/70 hover:text-primary',
              isItemActive(item) ? 'bg-base-200 text-primary' : ''
            ]"
          >
            <component :is="item.icon" class="w-5 h-5 shrink-0" />
            <span 
              :class="[
                'ml-3 text-sm whitespace-nowrap transition-all duration-500',
                expanded ? 'opacity-100 translate-x-0' : 'opacity-0 w-0'
              ]"
            >
              {{ item.label }}
            </span>
          </a>
        </li>
      </ul>
    </nav>

    <!-- Bottom Menu -->
    <div v-if="bottomItems && bottomItems.length" class="absolute bottom-0 left-0 right-0 p-2">
      <ul class="space-y-2">
        <li v-for="item in bottomItems" :key="item.key || item.label">
          <a
            @click.prevent="handleItemClick(item)"
            :class="[
              'flex items-center rounded-xl px-3 py-3 transition-all duration-200',
              'hover:bg-base-200 text-base-content/70 hover:text-primary',
              isItemActive(item) ? 'bg-base-200 text-primary' : ''
            ]"
          >
            <component :is="item.icon" class="w-5 h-5 shrink-0" />
            <span 
              :class="[
                'ml-3 text-sm whitespace-nowrap transition-all duration-500',
                expanded ? 'opacity-100 translate-x-0' : 'opacity-0 w-0'
              ]"
            >
              {{ item.label }}
            </span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  expanded: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array,
    required: true,
    default: () => []
  },
  bottomItems: {
    type: Array,
    default: () => []
  },
  activeKey: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['update:expanded', 'item-click'])

const expanded = ref(props.expanded)

const setExpanded = (value) => {
  expanded.value = value
  emit('update:expanded', value)
}

const handleItemClick = (item) => {
  emit('item-click', item)
}

const isItemActive = (item) => {
  return item.key === props.activeKey || item.route === props.activeKey
}

onMounted(() => {
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-theme') {
        emit('theme-change', document.documentElement.getAttribute('data-theme'))
      }
    })
  })

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  })
})
</script>