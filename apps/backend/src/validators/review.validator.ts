import { z } from 'zod';

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

const ReviewValidator = {
  createReviewSchema,
  updateReviewSchema,
};

export default ReviewValidator;
