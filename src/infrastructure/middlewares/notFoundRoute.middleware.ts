import type { Request, Response } from 'express';

export function notFoundRoute(
  req: Request,
  res: Response
) {
  res.status(404).json({
    message: 'Recurso no encontrado',
    method: req.method,
    path: req.originalUrl,
  });
}