<script setup>
import { onMounted, onUnmounted } from 'vue';
import Navbar from '@/components/app/Navbar.vue'; // (Sesuaikan path ini seperti yang sudah benar sebelumnya)
import MobileBottomNav from '@/components/app/MobileBottomNav.vue';
import Footer from '@/components/app/Footer.vue'; // 1. Import Footer di sini
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();

onMounted(() => {
    notificationStore.startPolling();
});

onUnmounted(() => {
    notificationStore.stopPolling();
});
</script>

<template>
    <div class="bg-gray-50 min-h-screen">
        <Navbar />

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 md:pb-8">
            <router-view></router-view>
        </main>

        <div class="pb-16 md:pb-0">
            <Footer />
        </div>

        <MobileBottomNav />
    </div>
</template>
