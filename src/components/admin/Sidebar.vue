<script setup>
import { onMounted, nextTick, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useTicketStore } from '@/stores/ticket';
import { useNotificationStore } from '@/stores/notification';
import { storeToRefs } from 'pinia';
import feather from 'feather-icons';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const { logout } = authStore;

const ticketStore = useTicketStore();
const { statistic } = storeToRefs(ticketStore);

const notificationStore = useNotificationStore();
const { unreadCount } = storeToRefs(notificationStore);

const handleLogout = async () => {
    await logout();
};

onMounted(async () => {
    await nextTick();
    feather.replace();
});

watch(unreadCount, async () => {
    await nextTick();
    feather.replace();
});
</script>

<template>
    <aside class="w-64 bg-white min-h-screen border-r border-gray-200 flex flex-col justify-between shadow-sm">
        
        <div>
            <div class="h-16 flex items-center px-6 border-b border-gray-100">
                <span class="text-xl font-bold text-blue-600 flex items-center tracking-wide">
                    <i data-feather="box" class="w-6 h-6 mr-2 text-blue-600"></i>
                    Student-Ticket
                </span>
            </div>

            <div class="p-4 mx-4 mt-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                    {{ user?.name ? user.name.charAt(0).toUpperCase() : 'A' }}
                </div>
                <div class="overflow-hidden">
                    <h4 class="text-sm font-semibold text-gray-800 truncate">{{ user?.name || 'Administrator' }}</h4>
                    <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
                </div>
            </div>
            
            <nav class="mt-6 px-3 space-y-1">
                
                <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu Utama</p>

                <RouterLink :to="{ name: 'admin.dashboard' }"
                    class="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    :class="$route.name === 'admin.dashboard' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                    <span :class="$route.name === 'admin.dashboard' ? 'text-blue-600' : 'text-gray-400'">
                        <i data-feather="home" class="w-5 h-5 mr-3"></i>
                    </span>
                    Dashboard
                </RouterLink>

                <RouterLink :to="{ name: 'admin.ticket', query: { status: 'open' } }"
                    class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    :class="($route.name === 'admin.ticket' && $route.query.status === 'open') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                    <div class="flex items-center">
                        <span :class="($route.name === 'admin.ticket' && $route.query.status === 'open') ? 'text-blue-600' : 'text-gray-400'">
                            <i data-feather="inbox" class="w-5 h-5 mr-3"></i>
                        </span>
                        Tiket Masuk
                    </div>
                    <span v-if="statistic?.status_distribution?.open > 0" 
                        class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                        {{ statistic?.status_distribution?.open }}
                    </span>
                </RouterLink>

                <RouterLink :to="{ name: 'admin.ticket' }"
                    class="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    :class="($route.name && $route.name.startsWith('admin.ticket') && !$route.query.status) ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                    <span :class="($route.name && $route.name.startsWith('admin.ticket') && !$route.query.status) ? 'text-blue-600' : 'text-gray-400'">
                        <i data-feather="tag" class="w-5 h-5 mr-3"></i>
                    </span>
                    Semua Tiket
                </RouterLink>

                <div class="pt-4 pb-1">
                    <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Manajemen</p>
                </div>

                <RouterLink :to="{ name: 'admin.users' }"
                    class="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    :class="($route.name && $route.name.startsWith('admin.users')) ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                    <span :class="($route.name && $route.name.startsWith('admin.users')) ? 'text-blue-600' : 'text-gray-400'">
                        <i data-feather="users" class="w-5 h-5 mr-3"></i>
                    </span>
                    Pengguna
                </RouterLink>

                <RouterLink :to="{ name: 'admin.reports' }"
                    class="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    :class="($route.name && $route.name.startsWith('admin.reports')) ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                    <span :class="($route.name && $route.name.startsWith('admin.reports')) ? 'text-blue-600' : 'text-gray-400'">
                        <i data-feather="file-text" class="w-5 h-5 mr-3"></i>
                    </span>
                    Laporan Rekap
                </RouterLink>

                <div class="pt-4 pb-1">
                    <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Notifikasi</p>
                </div>

                <RouterLink :to="{ name: 'admin.notifications' }"
                    class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    :class="($route.name === 'admin.notifications') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                    <div class="flex items-center">
                        <span :class="($route.name === 'admin.notifications') ? 'text-blue-600' : 'text-gray-400'">
                            <i data-feather="bell" class="w-5 h-5 mr-3"></i>
                        </span>
                        Notifikasi
                    </div>
                    <span v-if="unreadCount > 0"
                        class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {{ unreadCount > 99 ? '99+' : unreadCount }}
                    </span>
                </RouterLink>

            </nav>
        </div>

        <div class="p-4 border-t border-gray-100">
            <button @click="handleLogout"
                class="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200">
                <i data-feather="log-out" class="w-4 h-4 mr-2"></i>
                Keluar dari Sistem
            </button>
        </div>

    </aside>
</template>