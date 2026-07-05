import * as z from 'zod';

const AuthValidator = {
  login: z.object({
    email: z.string().email(),
    password: z.string().min(6).max(255),
  }),
  register: z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    password: z.string().min(6).max(255),
    role: z.enum(['CUSTOMER', 'ORGANIZER']),
    referralCode: z.string().min(4).max(20).optional(),
  }),
  previewCheckout: z.object({
    ticketPrice: z.number().int().min(0),
    pointsToUse: z.number().int().min(0).optional(),
    couponId: z.number().int().positive().optional(),
  }),
  redeemPoints: z.object({
    pointsToRedeem: z.number().int().positive(),
  }),
};
export default AuthValidator;
