<!-- SideMenu.vue -->
<template>
  <div class="drawer-side bg-base-200">
    <label for="dashboard-drawer" class="drawer-overlay"></label>
    <aside class="bg-base-200 w-64 min-h-screen">
      <!-- Menu Items -->
      <ul class="menu p-4 text-base-content">
        <li v-for="item in menuItems" :key="item.key"
          :class="{ 'bordered': currentRoute === item.route }">
          <a 
            @click="handleNavigate(item.route)"
            :class="{ 'active': currentRoute === item.route }"
          >
            <i :class="item.icon"></i>
            {{ item.label }}
          </a>
        </li>
      </ul>

      <!-- Footer Information -->
      <div class="absolute bottom-0 w-full p-4">
        <div class="text-sm text-base-content/60">
          <p>Version 1.0.0</p>
          <p>© 2025 Company Name</p>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentRoute: string
  menuItems: Array<{
    key: string
    label: string
    route: string
    icon: string
  }>
}>()

const emit = defineEmits<{
  (e: 'navigate', route: string): void
}>()

const handleNavigate = (route: string) => {
  emit('navigate', route)
}
</script>

<style scoped>
.bordered {
  border-left: 4px solid hsl(var(--p));
}
</style>