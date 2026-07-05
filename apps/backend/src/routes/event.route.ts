import { Router } from 'express';
import EventController from '../controllers/event.controller';
import ReviewController from '../controllers/review.controller';
import AuthMiddleware from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import EventValidator from '../validators/event.validator';
import ReviewValidator from '../validators/review.validator';
import { upload } from '../middlewares/upload.middleware';

const EventRouter = Router();

// Public routes
EventRouter.get('/', EventController.getPublicList);
EventRouter.get('/filters/categories', EventController.getCategories);
EventRouter.get('/filters/locations', EventController.getLocations);

// Create event (organizer only)
EventRouter.post(
  '/',
  AuthMiddleware.authMiddleware,
  AuthMiddleware.requireRole('ORGANIZER'),
  upload.single('image'),
  validate(EventValidator.create),
  EventController.create
);

// Get organizer's events
EventRouter.get(
  '/organizer/events',
  AuthMiddleware.authMiddleware,
  AuthMiddleware.requireRole('ORGANIZER'),
  EventController.getMyEvents
);

// Get event by ID (public)
EventRouter.get('/:id', EventController.getById);

// Get event reviews (public)
EventRouter.get('/:id/reviews', ReviewController.getEventReviews);

// Get review stats (public)
EventRouter.get('/:id/reviews/stats', ReviewController.getReviewStats);

// Create review (auth required)
EventRouter.post(
  '/:id/reviews',
  AuthMiddleware.authMiddleware,
  validate(ReviewValidator.createReviewSchema),
  ReviewController.createReview
);

// Update review (auth required)
EventRouter.put(
  '/:id/reviews/:reviewId',
  AuthMiddleware.authMiddleware,
  validate(ReviewValidator.updateReviewSchema),
  ReviewController.updateReview
);

// Delete review (auth required)
EventRouter.delete(
  '/:id/reviews/:reviewId',
  AuthMiddleware.authMiddleware,
  ReviewController.deleteReview
);

// Update event (organizer only)
EventRouter.put(
  '/:id',
  AuthMiddleware.authMiddleware,
  AuthMiddleware.requireRole('ORGANIZER'),
  upload.single('image'),
  validate(EventValidator.update),
  EventController.update
);

// Delete event (organizer only)
EventRouter.delete(
  '/:id',
  AuthMiddleware.authMiddleware,
  AuthMiddleware.requireRole('ORGANIZER'),
  EventController.delete
);

// Get event registrations (organizer only)
EventRouter.get(
  '/:id/registrations',
  AuthMiddleware.authMiddleware,
  AuthMiddleware.requireRole('ORGANIZER'),
  EventController.getRegistrations
);

// Register for event (customer only)
// EventRouter.post(
//   '/:id/register',
//   AuthMiddleware.authMiddleware,
//   AuthMiddleware.requireRole('CUSTOMER'),
//   validate(EventValidator.register),
//   EventController.register
// );

// Get event statistics (organizer only)
EventRouter.get(
  '/:id/stats',
  AuthMiddleware.authMiddleware,
  AuthMiddleware.requireRole('ORGANIZER'),
  EventController.getStats
);

export default EventRouter;
