import { Router } from 'express'
import { authenticate } from '../middlewares/auth.js'
import {
  listNotifications,
  markAllAsRead,
  markAsRead,
  registerDeviceToken,
  unreadCount,
} from '../controllers/notification.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', listNotifications)
router.get('/unread-count', unreadCount)
router.patch('/read-all', markAllAsRead)
router.patch('/:id/read', markAsRead)
router.post('/device-token', registerDeviceToken)

export default router
