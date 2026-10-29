<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import feather from 'feather-icons';
import { showPopup } from '@/helpers/popup';

const router = useRouter();
const userStore = useUserStore();
const { loading } = storeToRefs(userStore);

const form = ref({
    name: '',
    email: '',
    nim: '',
    role: 'user', 
    password: '',
    avatar: null
});

const showPassword = ref(false);

const togglePassword = () => {
    showPassword.value = !showPassword.value;
};

onMounted(() => {
    nextTick(() => {
        feather.replace();
    });
});

// Handler saat file dipilih
const handleFileUpload = (event) => {
    form.value.avatar = event.target.files[0];
};

const handleSubmit = async () => {
    const formData = new FormData();
    
    formData.append('name', form.value.name);
    formData.append('email', form.value.email);
    formData.append('nim', form.value.nim);
    formData.append('role', form.value.role);
    formData.append('password', form.value.password);

    if (form.value.avatar) {
        formData.append('avatar', form.value.avatar);
    }

    try {
        await userStore.createUser(formData);
        showPopup('User baru berhasil ditambahkan!');
        router.push({ name: 'admin.users' }); 
    } catch (error) {
        console.error("Gagal menambah user", error);
        showPopup('Gagal menambah data. Pastikan Email atau NIM belum digunakan.', 'error');
    }
};
</script>

<template>
    <div class="p-6">
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-gray-800">Tambah User Baru</h1>
            <button @click="router.push({ name: 'admin.users' })"
                class="flex items-center text-sm text-gray-500 hover:text-gray-700">
                <i data-feather="arrow-left" class="w-4 h-4 mr-1"></i>
                Kembali
            </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <form @submit.prevent="handleSubmit" class="p-6">
                
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Upload Avatar</label>
                    <input type="file" @change="handleFileUpload" accept="image/jpeg,image/png,image/jpg" 
                           class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    <p class="text-xs text-gray-400 mt-1">Opsional. (Maks: 2MB)</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                        <input type="text" v-model="form.name" required
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" v-model="form.email" required
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">NIM</label>
                        <input type="text" v-model="form.nim" required
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Role Akses</label>
                        <select v-model="form.role" required
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <div class="relative">
                           <input :type="showPassword ? 'text' : 'password'" v-model="form.password" autocomplete="new-password" required placeholder="Minimal 8 karakter" minlength="8"
                                class="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            
                           <button type="button" @click="togglePassword" 
                                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
                                
                                <i v-show="!showPassword" data-feather="eye" class="w-5 h-5"></i>
                                <i v-show="showPassword" data-feather="eye-off" class="w-5 h-5"></i>
                                
                            </button>
                        </div>
                    </div>
                </div>

                <div class="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
                    <button type="button" @click="router.push({ name: 'admin.users' })"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Batal
                    </button>
                    <button type="submit" :disabled="loading"
                        class="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                        <i v-if="loading" data-feather="loader" class="w-4 h-4 mr-2 animate-spin"></i>
                        {{ loading ? 'Menyimpan...' : 'Simpan User Baru' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
