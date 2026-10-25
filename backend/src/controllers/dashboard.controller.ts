import type { Request, Response } from 'express'
import { notImplemented } from '../utils/response.js'

/**
 * TODO implementasi statistik dashboard admin.
 * Bentuk respons yang diharapkan frontend:
 * {
 *   data: {
 *     total_tickets: number,
 *     active_tickets: number,       // open + in_progress
 *     resolved_tickets: number,
 *     avg_resolution_time: number,  // jam
 *     status_distribution: {
 *       open: number,
 *       in_progress: number,
 *       resolved: number,
 *       rejected: number
 *     }
 *   }
 * }
 */
export async function getStatistics(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'GET /dashboard/statistic')
}
