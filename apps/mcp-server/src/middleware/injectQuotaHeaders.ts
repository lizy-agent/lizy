import { Request, Response, NextFunction } from 'express';

export function injectQuotaHeaders(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res) as (body?: unknown) => Response;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res as any).json = function (body?: unknown) {
    const paymentMethod = req.mppCharged ? 'mpp' : req.x402Paid ? 'x402' : 'unknown';
    res.setHeader('X-Payment-Method', paymentMethod);
    return originalJson(body);
  };
  next();
}
