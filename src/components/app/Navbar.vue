<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const { logout } = authStore;

const notificationStore = useNotificationStore();
const { unreadCount } = storeToRefs(notificationStore);

const showUserMenu = ref(false);

const toggleUserMenu = () => {
    showUserMenu.value = !showUserMenu.value;
}

const handleLogout = async () => {
    await logout();
}
</script>

<template>
    <nav class="hidden md:block bg-white shadow-sm border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                
                <div class="flex items-center gap-8">
                    <RouterLink :to="{ name: 'app.dashboard' }" class="flex items-center gap-3">
                        <div class="flex-shrink-0">
                            <img src="/logo.png" alt="Logo Apa Kabar" class="h-10 w-auto" />
                        </div>
                        
                        <div class="text-left flex flex-col justify-center">
                            <span class="text-xl font-bold leading-none">
                                <span class="text-[#005AA1]">Apa</span> <span class="text-[#F58323]">Kabar</span>
                            </span>
                            <span class="text-[10px] sm:text-xs font-semibold text-gray-500 mt-1">
                                Aplikasi Pelaporan Kerusakan Barang
                            </span>
                        </div>
                    </RouterLink>

                    <div class="hidden md:flex space-x-6 h-16">
                        <RouterLink :to="{ name: 'app.dashboard' }"
                            class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                            :class="$route.name === 'app.dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
                            Beranda
                        </RouterLink>

                        <RouterLink :to="{ name: 'app.ticket.create' }"
                            class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                            :class="$route.name === 'app.ticket.create' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
                            Buat Tiket
                        </RouterLink>

                        <RouterLink :to="{ name: 'app.profile' }"
                            class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                            :class="$route.name === 'app.profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
                            Profil Saya
                        </RouterLink>
                    </div>
                </div>

                <div class="flex items-center space-x-4">
                    <RouterLink :to="{ name: 'app.notifications' }"
                        class="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Notifikasi">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span v-if="unreadCount > 0"
                            class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {{ unreadCount > 99 ? '99+' : unreadCount }}
                        </span>
                    </RouterLink>

                    <div class="relative">
                        <button @click="toggleUserMenu()"
                            class="flex items-center bg-gray-50 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                            <img :src="user?.avatar ? user.avatar : `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0D8ABC&color=fff`"
                                alt="Profile" class="w-8 h-8 rounded-full object-cover">
                            <span class="ml-2 text-sm font-medium text-gray-700">{{ user?.name }}</span>
                            <i data-feather="chevron-down" class="w-4 h-4 ml-2 text-gray-500"></i>
                        </button>
                        
                        <div v-if="showUserMenu"
                            class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                            <RouterLink :to="{ name: 'app.profile' }" @click="showUserMenu = false"
                                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                Profil
                            </RouterLink>
                            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                Pengaturan
                            </a>
                            <div class="border-t border-gray-100 my-1"></div>
                            <a href="#" @click="handleLogout"
                                class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                                Keluar
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </nav>
</template>