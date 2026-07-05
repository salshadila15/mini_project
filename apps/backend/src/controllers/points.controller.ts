import { Request, Response } from 'express';
import PointsService from '../services/points.service';
import ReferralService from '../services/referral.service';

const PointsController = {
  history: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const data = await PointsService.getPointsHistory(req.user.id);

      res.status(200).json({
        message: 'Success',
        data,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(400).json({ message });
    }
  },

  previewCheckout: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const data = await PointsService.previewCheckout(req.user.id, req.body);

      res.status(200).json({
        message: 'Success',
        data,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(400).json({ message });
    }
  },

  redeemPoints: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const data = await PointsService.redeemPoints(
        req.user.id,
        req.body.pointsToRedeem
      );

      res.status(200).json({
        message: 'Points redeemed successfully',
        data,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(400).json({ message });
    }
  },
};

export const ReferralController = {
  validate: async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      if (!code || Array.isArray(code)) {
        return res.status(400).json({ message: 'Referral code is required' });
      }

      const data = await ReferralService.validateReferralCode(code);

      res.status(200).json({
        message: 'Referral code is valid',
        data,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(404).json({ message });
    }
  },
};

export default PointsController;
