import { Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';

export async function getAuditLogs(_req: AuthRequest, res: Response) {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    return res.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
