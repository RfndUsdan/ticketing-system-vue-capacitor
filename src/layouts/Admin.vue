<script setup>
import { onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import feather from 'feather-icons'
import Sidebar from '@/components/admin/Sidebar.vue'
import { useNotificationStore } from '@/stores/notification'

const route = useRoute()
const notificationStore = useNotificationStore()
const { unreadCount } = storeToRefs(notificationStore)

onMounted(() => {
    notificationStore.startPolling()
    nextTick(() => feather.replace())
})

onUnmounted(() => {
    notificationStore.stopPolling()
})

watch([unreadCount, () => route.fullPath], () => {
    nextTick(() => feather.replace())
})
</script>

<template>
    <div class="flex h-screen">
        <!-- Sidebar -->
        <Sidebar />

        <!-- Main Content -->
        <main class="flex-1 overflow-x-hidden overflow-y-auto">
            <!-- Topbar -->
            <div class="bg-white shadow-sm sticky top-0 z-10">
                <div class="flex items-center justify-between px-6 py-4">
                    <h2 class="text-xl font-semibold text-gray-800">{{ $route.meta.title }}</h2>
                    <div class="flex items-center space-x-4">
                        <RouterLink :to="{ name: 'admin.notifications' }"
                            class="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                            title="Notifikasi">
                            <i data-feather="bell" class="w-6 h-6"></i>
                            <span v-if="unreadCount > 0"
                                class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {{ unreadCount > 99 ? '99+' : unreadCount }}
                            </span>
                        </RouterLink>
                        <div class="flex items-center bg-gray-50 px-4 py-2 rounded-full">
                            <img src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" alt="Profile"
                                class="w-8 h-8 rounded-full">
                            <span class="ml-2 text-sm font-medium text-gray-700">Admin</span>
                            <i data-feather="chevron-down" class="w-4 h-4 ml-2 text-gray-500"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="p-6 space-y-6">
                <router-view></router-view>
            </div>
        </main>
    </div>
</template>