import { Router } from 'express'
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from '../controllers/user.controller.js'
import { authenticate, requireAdmin } from '../middlewares/auth.js'
import { uploadAvatar } from '../middlewares/upload.js'
import { validate } from '../middlewares/validate.js'
import { adminReadLimit, adminWriteLimit } from '../middlewares/rate-limit.js'
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from '../validators/user.validator.js'

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/', adminReadLimit, validate(listUsersQuerySchema, 'query'), listUsers)
router.post('/', adminWriteLimit, uploadAvatar, validate(createUserSchema), createUser)
router.get('/:id', adminReadLimit, getUser)
// POST dipertahankan untuk kompatibilitas multipart frontend; spec menyediakan PUT/PATCH.
router.post('/:id', adminWriteLimit, uploadAvatar, validate(updateUserSchema), updateUser)
router.put('/:id', adminWriteLimit, uploadAvatar, validate(updateUserSchema), updateUser)
router.patch('/:id', adminWriteLimit, uploadAvatar, validate(updateUserSchema), updateUser)
router.delete('/:id', adminWriteLimit, deleteUser)

export default router
