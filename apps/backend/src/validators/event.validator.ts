import * as z from 'zod';

const EventValidator = {
  create: z.object({
    name: z.string().min(3).max(255),
    description: z.string().min(10).max(5000),
    price: z.coerce.number().int().min(0),
    date: z.string().datetime(),
    location: z.string().min(3).max(255),
    category: z.string().min(1).max(100),
    availableSeats: z.coerce.number().int().min(1),
    image: z.any().optional(), // Optional image file
  }),

  update: z.object({
    name: z.string().min(3).max(255).optional(),
    description: z.string().min(10).max(5000).optional(),
    price: z.coerce.number().int().min(0).optional(),
    date: z.string().datetime().optional(),
    location: z.string().min(3).max(255).optional(),
    category: z.string().min(1).max(100).optional(),
    availableSeats: z.coerce.number().int().min(1).optional(),
    image: z.any().optional(), // Optional image file
  }),

  register: z.object({
    quantity: z.coerce.number().int().min(1),
    pointsUsed: z.coerce.number().int().min(0).optional(),
    couponId: z.coerce.number().int().positive().optional(),
  }),
};

export default EventValidator;
