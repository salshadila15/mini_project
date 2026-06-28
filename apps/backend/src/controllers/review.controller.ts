import { Request, Response } from 'express';
import ReviewService from '../services/review.service';
import ReviewValidator from '../validators/review.validator';

const ReviewController = {
  createReview: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const eventId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const validatedData = ReviewValidator.createReviewSchema.parse(req.body);

      const review = await ReviewService.createReview(userId, eventId, {
        rating: validatedData.rating,
        title: validatedData.title,
        description: validatedData.description ?? null,
      });

      return res.status(201).json({
        message: 'Review created successfully',
        data: review,
      });
    } catch (error) {
      const err = error as any;
      return res.status(400).json({
        message: err.message || 'Failed to create review',
      });
    }
  },

  getEventReviews: async (req: Request, res: Response) => {
    try {
      const eventId = Number(req.params.id);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await ReviewService.getEventReviews(eventId, page, limit);

      return res.status(200).json({
        message: 'Reviews retrieved successfully',
        data: result,
      });
    } catch (error) {
      const err = error as any;
      return res.status(400).json({
        message: err.message || 'Failed to get reviews',
      });
    }
  },

  getReviewStats: async (req: Request, res: Response) => {
    try {
      const eventId = Number(req.params.id);

      const stats = await ReviewService.getEventStats(eventId);

      return res.status(200).json({
        message: 'Review stats retrieved successfully',
        data: stats,
      });
    } catch (error) {
      const err = error as any;
      return res.status(400).json({
        message: err.message || 'Failed to get review stats',
      });
    }
  },

  updateReview: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const reviewId = Number(req.params.reviewId);

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const validatedData = ReviewValidator.updateReviewSchema.parse(req.body);

      const updatePayload: any = {};
      if (validatedData.rating !== undefined) updatePayload.rating = validatedData.rating;
      if (validatedData.title !== undefined) updatePayload.title = validatedData.title;
      if ('description' in validatedData) updatePayload.description = validatedData.description ?? null;

      const review = await ReviewService.updateReview(reviewId, userId, updatePayload);

      return res.status(200).json({
        message: 'Review updated successfully',
        data: review,
      });
    } catch (error) {
      const err = error as any;
      if (err.message === 'Review not found') {
        return res.status(404).json({ message: 'Review not found' });
      }
      if (err.message.includes('Forbidden')) {
        return res.status(403).json({ message: err.message });
      }

      return res.status(400).json({
        message: err.message || 'Failed to update review',
      });
    }
  },

  deleteReview: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const reviewId = Number(req.params.reviewId);

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const result = await ReviewService.deleteReview(reviewId, userId);

      return res.status(200).json({
        message: 'Review deleted successfully',
        data: result,
      });
    } catch (error) {
      const err = error as any;
      if (err.message === 'Review not found') {
        return res.status(404).json({ message: 'Review not found' });
      }
      if (err.message.includes('Forbidden')) {
        return res.status(403).json({ message: err.message });
      }

      return res.status(400).json({
        message: err.message || 'Failed to delete review',
      });
    }
  },
};

export default ReviewController;
