import Admin from '@/layouts/Admin.vue'
import Auth from '@/layouts/Auth.vue'
import { useAuthStore } from '@/stores/auth'
import Dashboard from '@/views/admin/Dashboard.vue'
import TicketList from '@/views/admin/ticket/TicketList.vue'
import TicketDetail from '@/views/admin/ticket/TicketDetail.vue'
import UsersList from '@/views/admin/users/UsersList.vue'
import UserDetail from '@/views/admin/users/UserDetail.vue'
import UserCreate from '@/views/admin/users/UserCreate.vue'
import Login from '@/views/auth/Login.vue'
import Profile from '@/views/app/Profile.vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from '@/layouts/App.vue'
import AppDashboard from '@/views/app/Dashboard.vue'
import AppTicketDetail from '@/views/app/TicketDetail.vue'
import AppTicketCreate from '@/views/app/TicketCreate.vue'
import Register from '@/views/auth/Register.vue'
import Cookies from 'js-cookie'
import { showPopup } from '@/helpers/popup'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: App,
      children: [
        {
          path: '',
          name: 'app.dashboard',
          component: AppDashboard,
          meta: {
            requiresAuth: true,
            title: 'Dashboard',
          },
        },
        {
          path: 'profile',
          name: 'app.profile',
          component: Profile,
          meta: { requiresAuth: true, title: 'Profil Saya' },
        },
        {
          path: 'ticket/:code',
          name: 'app.ticket.detail',
          component: AppTicketDetail,
          meta: {
            requiresAuth: true,
            title: 'Ticket Detail',
          },
        },
        {
          path: 'ticket/create',
          name: 'app.ticket.create',
          component: AppTicketCreate,
        },
      ],
    },
    {
      path: '/admin',
      component: Admin,
      meta: { requiresAuth: true, isAdmin: true },
      children: [
        {
          path: 'dashboard',
          name: 'admin.dashboard',
          component: Dashboard,
          meta: { requiresAuth: true, isAdmin: true, title: 'Dashboard' },
        },
        {
          path: 'ticket',
          name: 'admin.ticket',
          component: TicketList,
          meta: { requiresAuth: true, isAdmin: true, title: 'Ticket' },
        },
        {
          path: 'ticket/:code',
          name: 'admin.ticket.detail',
          component: TicketDetail,
          meta: {
            requiresAuth: true,
            isAdmin: true,
            title: 'Ticket Detail',
          },
        },
        {
          path: 'users',
          name: 'admin.users',
          component: UsersList,
          meta: { requiresAuth: true, isAdmin: true, title: 'Manajemen User' },
        },
        {
          path: 'users/create',
          name: 'admin.users.create',
          component: UserCreate,
          meta: { requiresAuth: true, isAdmin: true, title: 'Tambah User' },
        },
        {
          path: 'users/:id',
          name: 'admin.users.detail',
          component: UserDetail, 
          meta: { requiresAuth: true, isAdmin: true, title: 'Detail User' },
        },
        {
          path: '/admin/reports',
          name: 'admin.reports',
          component: () => import('@/views/admin/Report.vue'),
          meta: { requiresAuth: true, isAdmin: true, title: 'Laporan' }, 
      },
      ],
    },
    {
      path: '/auth',
      component: Auth,
      children: [
        {
          path: 'login',
          name: 'login',
          component: Login,
        },
        {
          path: 'register',
          name: 'register',
          component: Register,
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const userData = JSON.parse(localStorage.getItem('user')) 
  const isAuthenticated = !!Cookies.get('token')

  if (to.matched.some(record => record.meta.requiresAuth)) {
    
    if (!isAuthenticated) {
      next({ name: 'login' })
    } 
    else if (to.matched.some(record => record.meta.isAdmin)) {
      
      if (userData && userData.role === 'admin') {
        next() 
      } else {
        showPopup('Akses ditolak. Anda bukan Admin.', 'error')
        next({ path: '/' }) 
      }
    } 
    else {
      next() 
    }
  } 
  else {
    next() 
  }
})


export default router
