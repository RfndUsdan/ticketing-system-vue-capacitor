import { prisma } from '../config/prisma.js'

type CreateNotificationInput = {
  userId: number
  type: string
  title: string
  message: string
  data?: Record<string, unknown> | null
}

async function sendPushToUser(_userId: number, _payload: { title: string; message: string; data?: Record<string, unknown> | null }) {
  // Push notification (FCM/APNs) integration point.
  // To enable FCM:
  // 1) Add service account credentials / server key handling.
  // 2) Fetch device tokens for the user from device_tokens table.
  // 3) Send via FCM HTTP v1 / legacy API.
  // This is intentionally a no-op scaffold so in-app notifications work without external setup.
  return
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: (input.data ?? null) as any,
    },
  })

  await sendPushToUser(input.userId, {
    title: input.title,
    message: input.message,
    data: input.data ?? null,
  }).catch(() => undefined)

  return notification
}

export async function createNotificationsForUsers(userIds: number[], input: Omit<CreateNotificationInput, 'userId'>) {
  const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean)
  if (uniqueUserIds.length === 0) return []

  const created = await prisma.\(
    uniqueUserIds.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          type: input.type,
          title: input.title,
          message: input.message,
          data: (input.data ?? null) as any,
        },
      }),
    ),
  )

  await Promise.all(
    uniqueUserIds.map((userId) =>
      sendPushToUser(userId, {
        title: input.title,
        message: input.message,
        data: input.data ?? null,
      }).catch(() => undefined),
    ),
  )

  return created
}

export async function notifyAdmins(input: Omit<CreateNotificationInput, 'userId'>, excludeUserId?: number) {
  const admins = await prisma.user.findMany({
    where: {
      role: 'admin',
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  })
  return createNotificationsForUsers(admins.map((a) => a.id), input)
}
