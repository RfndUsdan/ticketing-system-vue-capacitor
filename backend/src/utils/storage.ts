import fs from 'node:fs/promises'
import path from 'node:path'
import { storageDir } from '../middlewares/upload.js'

export function storedFilePath(
  directory: 'avatars' | 'tickets',
  filename: string,
): string {
  return `${directory}/${path.basename(filename)}`
}

export async function removeStoredFile(
  relativePath: string | null | undefined,
): Promise<void> {
  if (!relativePath || /^https?:\/\//i.test(relativePath)) return

  const root = path.resolve(storageDir)
  const target = path.resolve(root, relativePath)
  const relative = path.relative(root, target)
  if (
    !relative ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    return
  }

  try {
    await fs.unlink(target)
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return
    }
    throw error
  }
}

export async function removeUploadedFile(
  file: Express.Multer.File | undefined,
): Promise<void> {
  if (!file) return
  await fs.unlink(file.path).catch((error: unknown) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return
    }
    throw error
  })
}
