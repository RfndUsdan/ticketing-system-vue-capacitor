<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import feather from 'feather-icons';
import { axiosInstance } from '@/plugins/axios';

import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const isLoading = ref(false);
const showPassword = ref(false);
const isEditing = ref(false); 

let cropperInstance = null; 

const form = ref({
    name: user.value?.name || '',
    email: user.value?.email || '',
    nim: user.value?.nim || '',
    password: '',
    avatar: null
});

const currentAvatar = ref(user.value?.avatar || '');

const showCropModal = ref(false);
const imageToCrop = ref(null);
const imageRef = ref(null); 

const togglePassword = () => {
    showPassword.value = !showPassword.value;
};

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        imageToCrop.value = e.target.result;
        showCropModal.value = true; 
        
        nextTick(() => {
            if (cropperInstance) cropperInstance.destroy();
            cropperInstance = new Cropper(imageRef.value, {
                aspectRatio: 1, 
                viewMode: 1,
                autoCropArea: 1,
                background: false,
            });
        });
    };
    reader.readAsDataURL(file);
    
    event.target.value = '';
};

const confirmCrop = () => {
    if (!cropperInstance) return;
    
    cropperInstance.getCroppedCanvas({
        width: 500,
        height: 500,
        fillColor: '#fff'
    }).toBlob((blob) => {
        const croppedFile = new File([blob], "avatar_cropped.jpg", { type: "image/jpeg" });
        form.value.avatar = croppedFile;
        
        currentAvatar.value = URL.createObjectURL(blob);
        
        closeCropModal();
    }, 'image/jpeg');
};

const closeCropModal = () => {
    showCropModal.value = false;
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
    imageToCrop.value = null;
};

const handleDeleteAvatar = async () => {
    if (!confirm('Yakin ingin menghapus foto profil?')) return;
    
    const success = await authStore.deleteAvatar();
    
    if (success) {
        currentAvatar.value = '';
        form.value.avatar = null;
        alert('Foto profil berhasil dihapus.');
    } else {
        alert(authStore.error || 'Gagal menghapus foto profil.');
    }
};

const startEditing = () => {
    isEditing.value = true;
    nextTick(() => feather.replace()); 
};

const cancelEditing = () => {
    form.value.name = user.value?.name || '';
    form.value.email = user.value?.email || '';
    form.value.nim = user.value?.nim || '';
    form.value.password = '';
    form.value.avatar = null;
    currentAvatar.value = user.value?.avatar || '';
    
    isEditing.value = false;
    nextTick(() => feather.replace()); 
};

// --- FUNGSI LOGOUT DIPINDAHKAN KE SINI (Di luar handleSubmit) ---
const handleLogout = async () => {
    try {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            await authStore.logout();
        }
    } catch (error) {
        console.error("Logout gagal:", error);
        alert("Terjadi kesalahan saat logout.");
    }
};

onMounted(() => {
    nextTick(() => feather.replace());
});

const handleSubmit = async () => {
    isLoading.value = true;
    const formData = new FormData();
    
    formData.append('name', form.value.name);
    formData.append('email', form.value.email);
    formData.append('nim', form.value.nim);

    if (form.value.password) {
        formData.append('password', form.value.password);
    }
    if (form.value.avatar) {
        formData.append('avatar', form.value.avatar);
    }

    try {
        const response = await axiosInstance.post('/profile', formData);
        
        alert('Profil berhasil diperbarui!');
        authStore.user = response.data.data;
        localStorage.setItem('user', JSON.stringify(response.data.data));
        
        form.value.password = '';
        currentAvatar.value = response.data.data.avatar;
        
        isEditing.value = false;
        nextTick(() => feather.replace());
        
    } catch (error) {
        console.error("Gagal update profil", error);
        alert('Gagal memperbarui profil. Silakan periksa kembali data Anda.');
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">
        
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Profil Saya</h1>
            
            <button v-if="!isEditing" @click="startEditing"
                class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                <i data-feather="edit-2" class="w-4 h-4 mr-2"></i>
                Edit Profil
            </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            
            <div v-if="!isEditing" class="p-6 md:p-8">
                <div class="flex items-center gap-6 mb-8">
                    <img :src="currentAvatar ? currentAvatar : `https://ui-avatars.com/api/?name=${form.name}&background=0D8ABC&color=fff`" 
                         alt="Avatar" 
                         class="w-24 h-24 rounded-full object-cover border border-gray-200 shadow-sm">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">{{ form.name }}</h2>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2 capitalize">
                            {{ user?.role || 'Mahasiswa' }}
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 border-t border-gray-100 pt-8">
                    <div>
                        <p class="text-sm font-medium text-gray-500 mb-1">Nomor Induk Mahasiswa (NIM)</p>
                        <p class="text-base text-gray-900 font-semibold">{{ form.nim }}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500 mb-1">Alamat Email</p>
                        <p class="text-base text-gray-900 font-semibold">{{ form.email }}</p>
                    </div>
                    <button type="button" @click="handleLogout"
                        class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors">
                        <i data-feather="log-out" class="w-4 h-4 mr-2"></i>
                        Keluar (Logout)
                    </button>
                </div>
            </div>

            <form v-else @submit.prevent="handleSubmit" class="p-6 md:p-8 bg-gray-50/50">
                
                <div class="mb-8 flex items-center gap-6">
                    <img :src="currentAvatar ? currentAvatar : `https://ui-avatars.com/api/?name=${form.name}&background=0D8ABC&color=fff`" 
                         alt="Avatar" 
                         class="w-24 h-24 rounded-full object-cover border border-gray-200 shadow-sm">
                    
                    <div class="flex flex-col gap-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Ganti Foto Profil</label>
                        <input type="file" @change="handleFileUpload" accept="image/jpeg,image/png,image/jpg" 
                               class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                        
                        <button v-if="currentAvatar" type="button" @click="handleDeleteAvatar"
                            class="text-xs text-red-600 hover:text-red-800 font-medium text-left mt-2">
                            Hapus Foto Saat Ini
                        </button>
                        
                        <p class="text-xs text-gray-400 mt-1">Maksimal ukuran file: 2MB.</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                        <input type="text" v-model="form.name" required
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">NIM</label>
                        <input type="text" v-model="form.nim" required readonly
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none">
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" v-model="form.email" required
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                    </div>

                    <div class="md:col-span-2 mt-4 pt-6 border-t border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Ubah Password</h3>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Password Baru (Opsional)</label>
                        <div class="relative">
                            <input :type="showPassword ? 'text' : 'password'" v-model="form.password" autocomplete="new-password" placeholder="Kosongkan jika tidak ingin mengubah password" minlength="8"
                                class="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                            
                            <button type="button" @click="togglePassword" 
                                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
                                <i v-show="!showPassword" data-feather="eye" class="w-5 h-5"></i>
                                <i v-show="showPassword" data-feather="eye-off" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="mt-8 flex justify-end gap-3">
                    <button type="button" @click="cancelEditing" :disabled="isLoading"
                        class="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Batal
                    </button>
                    <button type="submit" :disabled="isLoading"
                        class="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                        <i v-if="isLoading" data-feather="loader" class="w-4 h-4 mr-2 animate-spin"></i>
                        {{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
                    </button>
                </div>
            </form>
        </div>

        <div v-show="showCropModal" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900 bg-opacity-75 p-4">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h3 class="text-lg font-semibold text-gray-900">Sesuaikan Posisi Foto</h3>
                    <button @click="closeCropModal" class="text-gray-400 hover:text-gray-600">
                        <i data-feather="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <div class="bg-gray-100 p-4 h-[400px] w-full flex items-center justify-center">
                    <img ref="imageRef" :src="imageToCrop" alt="Crop preview" class="max-h-full max-w-full block">
                </div>
                
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button @click="closeCropModal"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
                        Batal
                    </button>
                    <button @click="confirmCrop"
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Potong & Terapkan
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>
