import { Request, Response } from 'express';
import AuthService from '../services/auth.service';
import SendMail from '../helpers/send-mail';

const AuthController = {
  register: async (req: Request, res: Response) => {
    try {
      const result = await AuthService.register(req.body);

      if (result && result.email) {
        const sender = {
          address: "admin@eventhub.com",
          name: "EventHub Admin",
        };

        SendMail(
          sender,
          [result.email],
          "Welcome to EventHub!",
          `Hello ${result.name || 'User'}, welcome to EventHub! We're excited to have you on board. Start exploring events and enjoy your experience!`,  
        ).catch((err) => console.error('Error sending email:', err));
      }

      res.status(201).json({
        message: 'Register success',
        data: result,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(400).json({ message });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const result = await AuthService.login(req.body);

      res.status(200).json({
        message: 'Login success',
        data: result,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(401).json({ message });
    }
  },

  me: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const profile = await AuthService.getMe(req.user.id);

      res.status(200).json({
        message: 'Success',
        data: profile,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(404).json({ message });
    }
  },

  organizerOnly: (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Organizer access granted',
      data: req.user,
    });
  },

  customerOnly: (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Customer access granted',
      data: req.user,
    });
  },
};

export default AuthController;
