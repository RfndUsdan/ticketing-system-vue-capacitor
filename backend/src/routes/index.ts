import { Router } from 'express'
import authRoutes from './auth.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import healthRoutes from './health.routes.js'
import profileRoutes from './profile.routes.js'
import replyRoutes from './reply.routes.js'
import ticketRoutes from './ticket.routes.js'
import userRoutes from './user.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/', authRoutes)
router.use('/ticket', ticketRoutes)
router.use('/ticket-reply', replyRoutes)
router.use('/users', userRoutes)
router.use('/profile', profileRoutes)
router.use('/dashboard', dashboardRoutes)

export default router
