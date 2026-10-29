<script setup>
import { onMounted, ref, watch, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { capitalize, debounce } from 'lodash';
import feather from 'feather-icons';
import { showPopup, confirmPopup } from '@/helpers/popup';

const userStore = useUserStore();
const { users, loading } = storeToRefs(userStore);
const { fetchUsers, deleteUser } = userStore;

// Filter untuk manajemen user
const filters = ref({
    search: '',
    role: '',
});

watch(filters, debounce(async () => {
    await fetchUsers(filters.value);
    // nextTick memastikan DOM sudah ter-update sebelum icon di-render ulang
    nextTick(() => {
        feather.replace();
    });
}, 300), { deep: true });

onMounted(async () => {
    await fetchUsers();
    feather.replace();
});

const handleDelete = async (id) => {
    if (await confirmPopup('Apakah Anda yakin ingin menghapus user ini?', 'Hapus pengguna?')) {
        try {
            await deleteUser(id);
            nextTick(() => feather.replace());
        } catch (error) {
            showPopup(userStore.error || 'User tidak dapat dihapus. Periksa apakah user masih memiliki tiket.', 'error');
        }
    }
};
</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        </div>
    
    <div class="mt-4 flex justify-end">
        <RouterLink :to="{ name: 'admin.users.create' }"
            class="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <i data-feather="plus" class="w-4 h-4 mr-2"></i>
            Tambah User
        </RouterLink>
    </div>
    <div class="p-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="relative">
                        <input type="text" v-model="filters.search" placeholder="Cari nama, email, atau NIM..."
                            class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <i data-feather="search" class="w-4 h-4 text-gray-400 absolute left-3 top-2.5"></i>
                    </div>
                    <select v-model="filters.role"
                        class="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Semua Role</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Profil User</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                NIM</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-100">
                        <tr v-if="loading">
                            <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">Memuat data user...</td>
                        </tr>
                        <tr v-else-if="users.length === 0">
                            <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">Tidak ada data user yang ditemukan.</td>
                        </tr>
                        <tr v-else v-for="user in users" :key="user.id" class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <img :src="user.avatar ? user.avatar : `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`"
                                        :alt="user.name" class="w-8 h-8 rounded-full object-cover">
                                    <div class="ml-3">
                                        <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {{ user.nim }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {{ user.email }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-3 py-1 text-xs font-medium rounded-full" :class="{
                                    'text-purple-700 bg-purple-100': user.role === 'admin',
                                    'text-gray-700 bg-gray-100': user.role === 'user'
                                }">
                                    {{ capitalize(user.role) }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                                <RouterLink :to="{ name: 'admin.users.detail', params: { id: user.id } }"
                                    class="inline-flex items-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none">
                                    <i data-feather="edit" class="w-4 h-4"></i>
                                </RouterLink>
                                <button @click="handleDelete(user.id)"
                                    class="inline-flex items-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none">
                                    <i data-feather="trash-2" class="w-4 h-4"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
