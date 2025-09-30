import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};