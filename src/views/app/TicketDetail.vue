<script setup>
import { onMounted, ref } from 'vue'
import { useTicketStore } from '@/stores/ticket'
import { storeToRefs } from 'pinia'
import { capitalize } from 'lodash'
import feather from 'feather-icons'
import { DateTime } from 'luxon'
import { useRoute } from 'vue-router'

const ticketStore = useTicketStore()
const { success, error, loading} = storeToRefs(ticketStore)
const { fetchTicket, createTicketReply } = ticketStore

const route = useRoute()

const ticket = ref({})
const form = ref({
    content: '',
})

const fetchTicketDetail = async () => {
    try {
        const response = await fetchTicket(route.params.code)
        ticket.value = response || {}
    } catch {
        ticket.value = {}
    }
}

const handleSubmit = async () => {
    try {
        await createTicketReply(route.params.code, form.value)
        form.value.content = ''
        await fetchTicketDetail()
    } catch (err) {
        if (typeof error.value === 'string') alert(error.value)
        console.error('Gagal mengirim balasan:', err)
    }
}

const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'in progress' || s === 'in_progress') return 'text-yellow-700 bg-yellow-100';
    if (s === 'closed' || s === 'resolved') return 'text-green-700 bg-green-100';
    if (s === 'open') return 'text-blue-700 bg-blue-100';
    return 'text-gray-700 bg-gray-100'; // Default warna abu-abu
}

const getPriorityColor = (priority) => {
    const p = priority?.toLowerCase() || '';
    if (p === 'low') return 'text-green-700 bg-green-100';
    if (p === 'medium' || p === 'normal') return 'text-yellow-700 bg-yellow-100';
    if (p === 'high' || p === 'urgent') return 'text-red-700 bg-red-100';
    return 'text-gray-700 bg-gray-100'; // Default warna abu-abu
}

onMounted(async () => {
    await fetchTicketDetail()

    feather.replace()
})
</script>

<template>
    <!-- Back Button -->
    <div class="mb-6">
        <RouterLink :to="{ name: 'app.dashboard' }"
            class="inline-flex items-center text-sm text-gray-600 hover:text-gray-800">
            <i data-feather="arrow-left" class="w-4 h-4 mr-2"></i>
            Kembali ke Daftar Tiket
        </RouterLink>
    </div>

    <!-- Ticket Info -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-6" v-if="ticket.code">
        <div class="p-6">
            <!-- Header Info -->
            <div class="flex items-start justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">{{ ticket.title }}</h1>
                    <div class="mt-2 flex flex-wrap items-center gap-3">
                        <span :class="['px-3 py-1 text-sm font-medium rounded-full', getStatusColor(ticket.status)]">
                            {{ capitalize(ticket.status) }}
                        </span>
                        <span :class="['px-3 py-1 text-sm font-medium rounded-full', getPriorityColor(ticket.priority)]">
                            {{ capitalize(ticket.priority) }}
                        </span>
                        <span class="text-sm text-gray-500">#{{ ticket.code }}</span>
                        <span class="text-sm text-gray-500" v-if="ticket.created_at">
                            Dibuat pada {{ DateTime.fromISO(ticket.created_at).toFormat('dd MMMM yyyy, HH:mm') }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Deskripsi Tiket -->
            <div class="mt-6 pt-6 border-t border-gray-100">
                <h3 class="text-sm font-semibold text-gray-800 mb-3">Deskripsi Masalah:</h3>
                <!-- Penggunaan whitespace-pre-line agar enter/line break pada textarea tetap terbaca -->
                <p class="text-gray-700 whitespace-pre-line leading-relaxed">
                    {{ ticket.description }}
                </p>
            </div>

            <!-- Lampiran Gambar (Hanya tampil jika ada image_url) -->
            <div class="mt-6 pt-6 border-t border-gray-100" v-if="ticket.image_url">
                <h3 class="text-sm font-semibold text-gray-800 mb-3">Lampiran:</h3>
                <img :src="ticket.image_url" alt="Lampiran Tiket" 
                    class="max-w-full md:max-w-lg rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition"
                    @click="window.open(ticket.image_url, '_blank')"
                    title="Klik untuk memperbesar">
            </div>
        </div>
    </div>

    <!-- Discussion Thread -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <!-- Thread Header -->
        <div class="p-6 border-b border-gray-100" v-for="reply in ticket.ticket_replies" :key="reply.id">
            <div class="flex items-start space-x-4">
                <img :src="`https://ui-avatars.com/api/?name=${reply.user.name}&background=0D8ABC&color=fff`" alt="User"
                    class="w-10 h-10 rounded-full">
                <div class="flex-1">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-sm font-medium text-gray-800">{{ reply.user.name }}</h4>
                            <p class="text-xs text-gray-500">
                                {{ DateTime.fromISO(reply.created_at).toFormat('dd MMMM yyyy, HH:mm') }}
                            </p>
                        </div>
                    </div>
                    <div class="mt-3 text-sm text-gray-800">
                        <p class="whitespace-pre-line">{{ reply.content }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Reply Form -->
        <div class="p-6 border-t border-gray-100">
            <h4 class="text-sm font-medium text-gray-800 mb-4">Tambah Balasan</h4>
            <form @submit.prevent="handleSubmit" class="space-y-4">
                <div class="group">
                    <textarea v-model="form.content"
                        class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        :class="{ 'border-red-500 ring-red-500': error?.content }" rows="4"
                        placeholder="Tulis balasan Anda di sini..." minlength="5"></textarea>
                    <p class="mt-1 text-xs text-red-500" v-if="error?.content">
                        {{ error?.content?.join(', ') }}
                    </p>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                    </div>
                    <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" :disabled="loading">
                        <i data-feather="send" class="w-4 h-4 inline-block mr-2"></i>
                        <span v-if="!loading">
                            Kirim Balasan
                        </span>
                        <span v-else>
                            Loading...
                        </span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
