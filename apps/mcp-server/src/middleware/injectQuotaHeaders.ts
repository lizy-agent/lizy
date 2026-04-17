import { Request, Response, NextFunction } from 'express';

export function injectQuotaHeaders(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    // Headers are already sent; this is for logging only
  });

  const originalJson = res.json.bind(res) as (body?: unknown) => Response;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res as any).json = function (body?: unknown) {
    if (req.quotaUsed !== undefined && req.quotaLimit !== undefined) {
      res.setHeader('X-Quota-Used', req.quotaUsed.toString());
      res.setHeader('X-Quota-Limit', req.quotaLimit.toString());
      res.setHeader('X-Quota-Remaining', Math.max(0, req.quotaLimit - req.quotaUsed).toString());
    }

    const paymentMethod = req.mppCharged
      ? 'mpp'
      : req.x402Paid
        ? 'x402'
        : req.usedFreeQuota
          ? 'free_quota'
          : 'unknown';

    res.setHeader('X-Payment-Method', paymentMethod);

    return originalJson(body);
  };

  next();
}
