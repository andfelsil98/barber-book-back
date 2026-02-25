import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime();
  const { method, originalUrl, body } = req;
  
  res.on('finish', () => {
    const duration = getDurationInMs(start);
    const { statusCode } = res;
    let level: 'info' | 'warn' | 'error' = 'info';
    if (statusCode >= 500) level = 'error';
    else if (statusCode >= 400) level = 'warn';

    const requestedBy = req.decodedIdToken?.email ?? req.uid ?? "Anonymous user";
    const log: Record<string, unknown> = {
      method,
      url: originalUrl,
      statusCode,
      requestedBy,
      duration: `${duration.toFixed(2)} ms`,
    };
    if (['POST', 'PUT', 'PATCH'].includes(method) && Object.keys(body || {}).length > 0) log.body = sanitizeBody(body);
    logger.log({ level, message: JSON.stringify(log) });
  });
  next();
}

function getDurationInMs(start: [number, number]) {
  const diff = process.hrtime(start);
  return diff[0] * 1000 + diff[1] / 1e6;
}

function sanitizeBody(body: any) {
  const cloned = { ...body };
  ['password', 'token', 'secret'].forEach(key => {
    if (cloned[key]) cloned[key] = '[REDACTED]';
  });
  return cloned;
}