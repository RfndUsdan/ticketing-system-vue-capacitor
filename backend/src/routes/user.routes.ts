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
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from '../validators/user.validator.js'

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/', validate(listUsersQuerySchema, 'query'), listUsers)
router.post('/', uploadAvatar, validate(createUserSchema), createUser)
router.get('/:id', getUser)
// POST dipertahankan untuk kompatibilitas multipart frontend; spec menyediakan PUT/PATCH.
router.post('/:id', uploadAvatar, validate(updateUserSchema), updateUser)
router.put('/:id', uploadAvatar, validate(updateUserSchema), updateUser)
router.patch('/:id', uploadAvatar, validate(updateUserSchema), updateUser)
router.delete('/:id', deleteUser)

export default router
