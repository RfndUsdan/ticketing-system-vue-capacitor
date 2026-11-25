import { Router } from 'express'
import {
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword,
  validateResetToken,
} from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.js'
import {
  passwordResetRequestLimit,
  passwordResetVerifyLimit,
  loginLimit,
} from '../middlewares/rate-limit.js'
import { uploadAvatar } from '../middlewares/upload.js'
import { validate } from '../middlewares/validate.js'
import {
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js'

const router = Router()

// Frontend memanggil /api/login dan /api/register (bukan /api/auth/...).
router.post('/register', uploadAvatar, validate(registerSchema), register)
router.post('/login', loginLimit, login)
router.get('/me', authenticate, me)
router.post('/logout', authenticate, logout)

router.post(
  '/forgot-password',
  passwordResetRequestLimit,
  validate(forgotPasswordSchema),
  forgotPassword,
)
router.get('/reset-password/:token', passwordResetVerifyLimit, validateResetToken)
router.post(
  '/reset-password',
  passwordResetVerifyLimit,
  validate(resetPasswordSchema),
  resetPassword,
)

export default router
