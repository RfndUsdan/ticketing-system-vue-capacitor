<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useTicketStore } from '@/stores/ticket';
import { storeToRefs } from 'pinia';
import { DateTime } from 'luxon';
import { capitalize } from 'lodash';
import feather from 'feather-icons';
import { showPopup } from '@/helpers/popup';

const ticketStore = useTicketStore();
const { tickets, loading } = storeToRefs(ticketStore);
const { fetchTickets } = ticketStore;

const filters = ref({
    month: '', 
    category: '',
    status: '',
});

onMounted(async () => {
    await fetchTickets();
    await nextTick();
    feather.replace();
});

const filteredTickets = computed(() => {
    if (!tickets.value) return [];
    
    return tickets.value.filter(ticket => {
        const ticketMonth = DateTime.fromISO(ticket.created_at).toFormat('yyyy-MM');
        const matchMonth = !filters.value.month || ticketMonth === filters.value.month;
        
        const matchCategory = !filters.value.category || ticket.category === filters.value.category;
        
        const matchStatus = !filters.value.status || ticket.status === filters.value.status;
        
        return matchMonth && matchCategory && matchStatus;
    });
});

const getStatusClass = (status) => {
    switch (status) {
        case 'open': return 'text-blue-700 bg-blue-100';
        case 'in_progress': return 'text-yellow-700 bg-yellow-100';
        case 'resolved': return 'text-green-700 bg-green-100';
        case 'rejected': return 'text-red-700 bg-red-100';
        default: return 'text-gray-700 bg-gray-100';
    }
};

const exportToExcel = () => {
    if (filteredTickets.value.length === 0) {
        showPopup('Tidak ada data untuk diekspor!', 'warning');
        return;
    }

    let csvContent = "\uFEFFKode Tiket,Tanggal Laporan,Pelapor,Kategori,Prioritas,Status,Judul Kerusakan\n";

    filteredTickets.value.forEach(t => {
        const dateStr = DateTime.fromISO(t.created_at).toFormat('yyyy-MM-dd HH:mm');
        const pelapor = t.user?.name || 'Anonim';
        const title = (t.title || '').replace(/"/g, '""');
        
        const row = `"#${t.code}","${dateStr}","${pelapor}","${t.category || 'Lainnya'}","${t.priority}","${t.status}","${title}"`;
        csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Kerusakan_${filters.value.month || 'Semua_Waktu'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
};

const printPDF = () => {
    window.print();
};
</script>

<template>
    <div class="p-6 max-w-7xl mx-auto">
        <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between print:hidden">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Laporan Rekapitulasi Kerusakan</h1>
                <p class="text-sm text-gray-500 mt-1">Unduh atau cetak bukti laporan penanganan fasilitas dan sarana prasarana.</p>
            </div>
            
            <div class="flex items-center space-x-3 mt-4 md:mt-0">
                <button @click="exportToExcel" 
                    class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer">
                    <i data-feather="grid" class="w-4 h-4 mr-2"></i>
                    Export Excel (.csv)
                </button>
                <button @click="printPDF" 
                    class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer">
                    <i data-feather="printer" class="w-4 h-4 mr-2"></i>
                    Cetak PDF
                </button>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 print:hidden">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Filter Periode & Kategori</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Bulan Laporan</label>
                    <input type="month" v-model="filters.month" 
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Kategori Kerusakan</label>
                    <select v-model="filters.category" 
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                        <option value="">Semua Kategori</option>
                        <option value="Fasilitas">Fasilitas & Infrastruktur</option>
                        <option value="Jaringan">Jaringan & Wi-Fi</option>
                        <option value="Kebersihan">Kebersihan & Lingkungan</option>
                        <option value="Administrasi">Administrasi</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Status Penanganan</label>
                    <select v-model="filters.status" 
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                        <option value="">Semua Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved (Selesai)</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>
        </div>


        <div id="print-area" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            
            <div class="hidden print:block mb-6 border-b-2 border-gray-900 pb-4 text-center">
                <h2 class="text-xl font-bold uppercase tracking-wider text-gray-900">LAPORAN REKAPITULASI KERUSAKAN BARANG</h2>
                <p class="text-sm text-gray-700 mt-1">Sistem Pelaporan Student-Ticket (Apa Kabar) - Universitas PGRI Madiun</p>
                <p class="text-xs text-gray-500 mt-1">Periode: {{ filters.month ? DateTime.fromISO(filters.month).toFormat('MMMM yyyy') : 'Semua Waktu' }}</p>
            </div>

            <div class="flex items-center justify-between mb-4 print:hidden">
                <span class="text-sm font-semibold text-gray-700">
                    Menampilkan <span class="text-blue-600">{{ filteredTickets.length }}</span> laporan
                </span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-200 print:bg-gray-100 print:border-gray-800">
                            <th class="py-3 px-3 text-xs font-semibold text-gray-600 uppercase print:text-black print:py-2">No</th>
                            <th class="py-3 px-3 text-xs font-semibold text-gray-600 uppercase print:text-black print:py-2">Kode</th>
                            <th class="py-3 px-3 text-xs font-semibold text-gray-600 uppercase print:text-black print:py-2">Tanggal</th>
                            <th class="py-3 px-3 text-xs font-semibold text-gray-600 uppercase print:text-black print:py-2">Pelapor</th>
                            <th class="py-3 px-3 text-xs font-semibold text-gray-600 uppercase print:text-black print:py-2">Kategori</th>
                            <th class="py-3 px-3 text-xs font-semibold text-gray-600 uppercase print:text-black print:py-2">Judul Kerusakan</th>
                            <th class="py-3 px-3 text-xs font-semibold text-gray-600 uppercase text-center print:text-black print:py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 print:divide-gray-300">
                        <tr v-if="filteredTickets.length === 0">
                            <td colSpan="7" class="py-8 text-center text-sm text-gray-400">
                                Tidak ada laporan yang sesuai dengan filter yang dipilih.
                            </td>
                        </tr>
                        <tr v-for="(ticket, index) in filteredTickets" :key="ticket.code" class="hover:bg-gray-50/50">
                            <td class="py-3 px-3 text-sm text-gray-500 print:text-black print:py-2">{{ index + 1 }}</td>
                            <td class="py-3 px-3 text-sm font-bold text-blue-600 print:text-black print:py-2">#{{ ticket.code }}</td>
                            <td class="py-3 px-3 text-sm text-gray-600 whitespace-nowrap print:text-black print:py-2">
                                {{ DateTime.fromISO(ticket.created_at).toFormat('dd/MM/yyyy') }}
                            </td>
                            <td class="py-3 px-3 text-sm font-medium text-gray-800 print:text-black print:py-2">
                                {{ ticket.user?.name || 'Anonim' }}
                            </td>
                            <td class="py-3 px-3 text-sm text-gray-600 print:text-black print:py-2">
                                <span class="px-2 py-0.5 bg-gray-100 rounded text-xs border border-gray-200 print:bg-transparent print:border-none print:p-0">
                                    {{ ticket.category }}
                                </span>
                            </td>
                            <td class="py-3 px-3 text-sm text-gray-800 max-w-xs truncate print:max-w-none print:whitespace-normal print:text-black print:py-2">
                                {{ ticket.title }}
                            </td>
                            <td class="py-3 px-3 text-sm text-center whitespace-nowrap print:py-2">
                                <span :class="getStatusClass(ticket.status)" 
                                    class="px-2.5 py-0.5 text-xs font-medium rounded-full print:border print:border-gray-600 print:bg-transparent print:text-black">
                                    {{ capitalize(ticket.status) }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="hidden print:flex justify-end mt-12 pt-4">
                <div class="text-center w-64">
                    <p class="text-sm text-gray-800">Madiun, {{ DateTime.now().toFormat('dd MMMM yyyy') }}</p>
                    <p class="text-sm font-semibold text-gray-800 mt-1">Mengetahui, Pengelola Sarana</p>
                    <div class="h-20"></div> <!-- Ruang tanda tangan -->
                    <p class="text-sm font-bold text-gray-900 underline">( ............................................ )</p>
                    <p class="text-xs text-gray-600">NIP. ........................................</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
@media print {
    body * {
        visibility: hidden !important;
    }
    
    #print-area, #print-area * {
        visibility: visible !important;
    }
    
    #print-area {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
    }

    @page {
        size: A4 landscape;
        margin: 1.5cm;
    }
}
</style>
