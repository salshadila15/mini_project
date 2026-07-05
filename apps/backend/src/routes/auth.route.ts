import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import PointsController, { ReferralController } from '../controllers/points.controller';
import AuthMiddleware from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import AuthValidator from '../validators/auth.validator';
import { loginSchema } from '../schemas/auth.schema';

const AuthRouter = Router();

AuthRouter.post('/login', validate(AuthValidator.login), AuthController.login);
AuthRouter.post('/register', validate(AuthValidator.register), AuthController.register);
AuthRouter.get('/referral/validate/:code', ReferralController.validate);
AuthRouter.get('/me', AuthMiddleware.authMiddleware, AuthController.me);
AuthRouter.get('/points', AuthMiddleware.authMiddleware, PointsController.history);
AuthRouter.post(
  '/checkout/preview',
  AuthMiddleware.authMiddleware,
  validate(AuthValidator.previewCheckout),
  PointsController.previewCheckout
);
AuthRouter.post(
  '/points/redeem',
  AuthMiddleware.authMiddleware,
  validate(AuthValidator.redeemPoints),
  PointsController.redeemPoints
);
AuthRouter.get(
  '/customer-only',
  AuthMiddleware.authMiddleware,
  AuthMiddleware.requireRole('CUSTOMER'),
  AuthController.customerOnly
);
AuthRouter.get(
  '/organizer-only',
  AuthMiddleware.authMiddleware,
  AuthMiddleware.requireRole('ORGANIZER'),
  AuthController.organizerOnly
);

export default AuthRouter;
