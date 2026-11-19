<script setup>
import { onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import feather from 'feather-icons';
import { useNotificationStore } from '@/stores/notification';

const route = useRoute();
const notificationStore = useNotificationStore();
const { unreadCount } = storeToRefs(notificationStore);

// Render ulang ikon saat pengguna berpindah halaman
watch(() => route.path, () => {
    nextTick(() => {
        feather.replace();
    });
});

watch([route, unreadCount], () => {
    nextTick(() => {
        feather.replace();
    });
});

onMounted(() => {
    nextTick(() => {
        feather.replace();
    });
});
</script>

<template>
    <div class="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div class="flex justify-around items-center h-16 px-2">
            
            <RouterLink :to="{ name: 'app.dashboard' }" 
                class="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-600 transition-colors"
                exact-active-class="!text-blue-600">
                <i data-feather="home" class="w-6 h-6 mb-1"></i>
                <span class="text-[10px] font-medium">Beranda</span>
            </RouterLink>

            <RouterLink :to="{ name: 'app.ticket.create' }" 
                        class="flex flex-col items-center justify-center w-full h-full group text-gray-400 hover:text-blue-600">
                
                <div class="relative w-6 h-6 mb-1">
                    
                    <img src="/logo.png" alt="Logo" 
                        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 object-contain md:hidden transition-all duration-200" 
                        :class="{
                            /* Class dinamis sekarang hanya mengatur kemunculan stroke/shadow */
                            '[filter:drop-shadow(0_0_2px_#005AA1)_drop-shadow(0_0_2px_#005AA1)]': route.name === 'app.ticket.create',
                            'drop-shadow-none': route.name !== 'app.ticket.create'
                        }" />

                </div>
                
                <span class="text-[10px] font-medium" 
                    :class="{ 
                        '!text-blue-600': route.name === 'app.ticket.create' 
                    }">
                    Buat Tiket
                </span>
            </RouterLink>

            <RouterLink :to="{ name: 'app.notifications' }" 
                class="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-600 transition-colors"
                exact-active-class="!text-blue-600">
                <div class="relative">
                    <i data-feather="bell" class="w-6 h-6 mb-1"></i>
                    <span v-if="unreadCount > 0"
                        class="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                        {{ unreadCount > 99 ? '99+' : unreadCount }}
                    </span>
                </div>
                <span class="text-[10px] font-medium">Notifikasi</span>
            </RouterLink>

            <RouterLink :to="{ name: 'app.profile' }" 
                class="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-600 transition-colors"
                exact-active-class="!text-blue-600">
                <i data-feather="user" class="w-6 h-6 mb-1"></i>
                <span class="text-[10px] font-medium">Profil</span>
            </RouterLink>

        </div>
    </div>
</template>