<script setup>
import { onMounted, ref, watch } from 'vue';
import { useTicketStore } from '@/stores/ticket';
import { storeToRefs } from 'pinia';
import { debounce } from 'lodash';
import feather from 'feather-icons'
import { DateTime } from 'luxon';

const ticketStore = useTicketStore()
const { tickets } = storeToRefs(ticketStore)
const { fetchTickets } = ticketStore

// TODO: Create filters ref with search fields
// Hint: You'll need search, status, priority, and date
const filters = ref({
    search: '',
    status: '',
    priority: '',
    date: '',
})

// TODO: Implement watch effect on filters
// Hint: Use debounce and call fetchTickets with updated filters
watch(filters, debounce(async () => {
    await fetchTickets(filters.value)
}, 300), { deep: true})

// TODO: Implement onMounted hook
// Hint: Fetch initial tickets and initialize feather icons
onMounted(async() => {
    await fetchTickets()

    feather.replace()
})
</script>

<template>
    <div class="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">

        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Tiket Saya</h1>
                <p class="text-sm text-gray-500 mt-1">Kelola dan pantau status tiket Anda</p>
            </div>
            
            <RouterLink :to="{ name: 'app.ticket.create' }"
                class="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <i data-feather="plus" class="w-4 h-4 mr-2"></i>
                Buat Tiket Baru
            </RouterLink>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div class="p-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="relative">
                        <input type="text" placeholder="Cari tiket..." v-model="filters.search"
                            class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <i data-feather="search" class="w-4 h-4 text-gray-400 absolute left-3 top-2.5"></i>
                    </div>
                    <select v-model="filters.status"
                        class="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Semua Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <select v-model="filters.priority"
                        class="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Semua Prioritas</option>
                        <option value="low">Rendah</option>
                        <option value="medium">Sedang</option>
                        <option value="high">Tinggi</option>
                    </select>
                    <select v-model="filters.date"
                        class="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Semua Tanggal</option>
                        <option value="today">Hari Ini</option>
                        <option value="week">Minggu Ini</option>
                        <option value="month">Bulan Ini</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                v-for="ticket in tickets" :key="ticket.code">
                
                <RouterLink :to="{ name: 'app.ticket.detail', params: { code: ticket.code } }" class="block p-4 sm:p-6">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center flex-wrap gap-2">
                                <h3 class="text-base sm:text-lg font-semibold text-gray-800">{{ ticket.title }}</h3>
                                
                                <span class="px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full" 
                                    :class="{
                                        'text-blue-700 bg-blue-100': ticket.status === 'open',
                                        'text-yellow-700 bg-yellow-100': ticket.status === 'in_progress',
                                        'text-green-700 bg-green-100': ticket.status === 'resolved',
                                        'text-red-700 bg-red-100': ticket.status === 'rejected'
                                    }">
                                    {{ ticket.status === 'in_progress' ? 'In Progress' : ticket.status.toUpperCase() }}
                                </span>

                                <span class="px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full"
                                    :class="{
                                        'text-red-700 bg-red-100': ticket.priority === 'high',
                                        'text-yellow-700 bg-yellow-100': ticket.priority === 'medium',
                                        'text-green-700 bg-green-100': ticket.priority === 'low'
                                    }">
                                    {{ ticket.priority === 'high' ? 'Tinggi' : (ticket.priority === 'medium' ? 'Sedang' : 'Rendah') }}
                                </span>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-500 mt-2">#{{ ticket.code }} • Dibuat pada {{ DateTime.fromISO(ticket.created_at).toFormat('dd MMMM yyyy, HH:mm') }}</p>
                            <p class="text-sm text-gray-600 mt-2">{{ ticket.description }}</p>
                            <div class="mt-4 flex flex-wrap items-center gap-4">
                                <div class="flex items-center text-xs sm:text-sm text-gray-500">
                                    <i data-feather="message-square" class="w-4 h-4 mr-1"></i>
                                    <span>{{ ticket.ticket_replies?.length || 0 }} balasan</span>
                                </div>
                                <div class="flex items-center text-xs sm:text-sm text-gray-500">
                                    <i data-feather="clock" class="w-4 h-4 mr-1"></i>
                                    <span>Terakhir diupdate {{ DateTime.fromISO(ticket.updated_at).toFormat('dd MMMM yyyy, HH:mm') }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="ml-2 sm:ml-4 mt-1">
                            <i data-feather="chevron-right" class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"></i>
                        </div>
                    </div>
                </RouterLink>
            </div>
        </div>

    </div>
</template>
