import { Request, Response } from 'express';
import EventService from '../services/event.service';

const EventController = {
  getPublicList: async (req: Request, res: Response) => {
    try {
      const search = (req.query.search as string) || '';
      const category = (req.query.category as string) || '';
      const location = (req.query.location as string) || '';
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      if (page < 1) {
        return res.status(400).json({ message: 'Page must be at least 1' });
      }

      const result = await EventService.getPublicEvents(search, category, location, page, limit);

      res.status(200).json({
        message: 'Success',
        data: result,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(400).json({ message });
    }
  },

  getCategories: async (req: Request, res: Response) => {
    try {
      const categories = await EventService.getUniqueCategories();
      res.status(200).json({
        message: 'Success',
        data: categories,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(400).json({ message });
    }
  },

  getLocations: async (req: Request, res: Response) => {
    try {
      const locations = await EventService.getUniqueLocations();
      res.status(200).json({
        message: 'Success',
        data: locations,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(400).json({ message });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const event = await EventService.createEvent(req.user.id, req.body, req.file);
      res.status(201).json({
        message: 'Event created successfully',
        data: event,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(400).json({ message });
    }
  },

  getMyEvents: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const events = await EventService.getOrganizerEvents(req.user.id);
      res.status(200).json({
        message: 'Success',
        data: events,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(400).json({ message });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const eventId = Number(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      const event = await EventService.getEventById(eventId);
      res.status(200).json({
        message: 'Success',
        data: event,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      const statusCode = message === 'Event not found' ? 404 : 400;
      res.status(statusCode).json({ message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const eventId = Number(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      const event = await EventService.updateEvent(
        eventId,
        req.user.id,
        req.body,
        req.file
      );
      res.status(200).json({
        message: 'Event updated successfully',
        data: event,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      const statusCode = message.includes('not found')
        ? 404
        : message.includes('Forbidden')
          ? 403
          : 400;
      res.status(statusCode).json({ message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const eventId = Number(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      await EventService.deleteEvent(eventId, req.user.id);
      res.status(200).json({
        message: 'Event deleted successfully',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      const statusCode = message.includes('not found')
        ? 404
        : message.includes('Forbidden')
          ? 403
          : 400;
      res.status(statusCode).json({ message });
    }
  },

  getRegistrations: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const eventId = Number(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      const registrations = await EventService.getEventRegistrations(
        eventId,
        req.user.id
      );
      res.status(200).json({
        message: 'Success',
        data: registrations,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      const statusCode = message.includes('Forbidden') ? 403 : 400;
      res.status(statusCode).json({ message });
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const eventId = Number(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      const { quantity, pointsUsed, couponId } = req.body;

      const registration = await EventService.registerForEvent(
        req.user.id,
        eventId,
        quantity,
        pointsUsed || 0,
        couponId
      );

      res.status(201).json({
        message: 'Registration successful',
        data: registration,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      res.status(400).json({ message });
    }
  },

  getStats: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const eventId = Number(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      const { startDate, endDate } = req.query;

      const stats = await EventService.getEventStats(
        eventId,
        req.user.id,
        startDate as string | undefined,
        endDate as string | undefined
      );

      res.status(200).json({
        message: 'Success',
        data: stats,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      const statusCode = message.includes('Forbidden') ? 403 : 400;
      res.status(statusCode).json({ message });
    }
  },
};

export default EventController;
