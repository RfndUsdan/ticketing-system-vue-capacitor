<script setup>
import { RouterLink, RouterView } from 'vue-router'
import PopupHost from '@/components/app/PopupHost.vue'
import TicketNotifications from '@/components/app/TicketNotifications.vue'
</script>

<template>
  <RouterView />
  <TicketNotifications />
  <PopupHost />
</template>
