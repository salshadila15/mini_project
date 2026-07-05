import prisma from '../lib/prisma';
import cloudinary from '../helpers/cloudinary';
import fs from 'fs';

export type CreateEventInput = {
  name: string;
  description: string;
  price: number;
  date: string;
  location: string;
  category: string;
  availableSeats: number;
};

export type UpdateEventInput = Partial<CreateEventInput>;

const EventService = {
  getPublicEvents: async (
    search?: string,
    category?: string,
    location?: string,
    page: number = 1,
    limit: number = 10
  ) => {
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Record<string, unknown> = {
      date: { gte: now },
    };

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category.trim()) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (location && location.trim()) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          date: true,
          location: true,
          category: true,
          availableSeats: true,
          image: true,
          organizer: { select: { id: true, name: true, email: true } },
          createdAt: true,
        },
        orderBy: { date: 'asc' },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  getUniqueCategories: async () => {
    const events = await prisma.event.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { date: { gte: new Date() } },
    });
    return events.map((e) => e.category).filter(Boolean).sort();
  },

  getUniqueLocations: async () => {
    const events = await prisma.event.findMany({
      select: { location: true },
      distinct: ['location'],
      where: { date: { gte: new Date() } },
    });
    return events.map((e) => e.location).filter(Boolean).sort();
  },

// 💡 Ganti fungsi createEvent asli kamu dengan yang sudah terintegrasi Cloudinary ini:
  createEvent: async (organizerId: number, data: CreateEventInput, file?: Express.Multer.File) => {
    const eventDate = new Date(data.date);

    if (isNaN(eventDate.getTime())) {
      throw new Error('Invalid event date');
    }

    let imageUrl: string | null = null;

    // ☁️ Integrasi Cloudinary untuk Create
    if (file) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'eventhub-events',
          resource_type: 'auto',
        });
        imageUrl = result.secure_url; // Ambil URL dari Cloudinary
        fs.unlinkSync(file.path);     // Hapus file lokal
      } catch (error) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw new Error('Gagal mengunggah gambar ke Cloudinary');
      }
    }

    return prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        price: Number(data.price), // Pastikan bertipe Number
        date: eventDate,
        location: data.location,
        category: data.category,
        availableSeats: Number(data.availableSeats), // Pastikan bertipe Number
        organizerId,
        image: imageUrl, // 👈 Pasang URL Cloudinary di database
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        date: true,
        location: true,
        category: true,
        availableSeats: true,
        image: true,
        organizerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  getOrganizerEvents: async (organizerId: number) => {
    return prisma.event.findMany({
      where: { organizerId },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        date: true,
        location: true,
        category: true,
        availableSeats: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { date: 'desc' },
    });
  },

  getEventById: async (eventId: number) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        date: true,
        location: true,
        category: true,
        availableSeats: true,
        organizerId: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  },

  // 💡 Ganti fungsi updateEvent asli kamu dengan yang sudah terintegrasi Cloudinary ini:
  updateEvent: async (
    eventId: number,
    organizerId: number,
    data: UpdateEventInput,
    file?: Express.Multer.File
  ) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { 
        organizerId: true,
        image: true
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('Forbidden: You can only edit your own events');
    }

    let imageUrl: string | null = event.image;

    // ☁️ Integrasi Cloudinary untuk Update Gambar Baru
    if (file) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'eventhub-events',
          resource_type: 'auto',
        });
        imageUrl = result.secure_url;
        fs.unlinkSync(file.path);
      } catch (error) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw new Error('Gagal mengunggah gambar baru ke Cloudinary');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = Number(data.price);
    if (data.date) updateData.date = new Date(data.date);
    if (data.location) updateData.location = data.location;
    if (data.category) updateData.category = data.category;
    if (data.availableSeats !== undefined)
      updateData.availableSeats = Number(data.availableSeats);
    
    // Pasang URL gambar (baik yang baru diupload maupun yang lama)
    updateData.image = imageUrl;

    return prisma.event.update({
      where: { id: eventId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        date: true,
        location: true,
        category: true,
        availableSeats: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  deleteEvent: async (eventId: number, organizerId: number) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('Forbidden: You can only delete your own events');
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return { success: true };
  },

  getEventRegistrations: async (eventId: number, organizerId: number) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('Forbidden');
    }

    return prisma.eventRegistration.findMany({
      where: { eventId },
      select: {
        id: true,
        userId: true,
        user: { select: { name: true, email: true } },
        quantity: true,
        price: true,
        totalPrice: true,
        pointsUsed: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  registerForEvent: async (
    userId: number,
    eventId: number,
    quantity: number,
    pointsUsed: number,
    couponId?: number
  ) => {
    return prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { price: true, availableSeats: true, organizerId: true },
      });

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.organizerId === userId) {
        throw new Error('Organizers cannot register for their own events');
      }

      if (quantity > event.availableSeats) {
        throw new Error('Not enough available seats');
      }

      const price = event.price;
      const totalPrice = price * quantity;
      const finalPrice = totalPrice - pointsUsed;

      if (finalPrice < 0) {
        throw new Error('Invalid points redemption');
      }

      const registrationStatus = finalPrice === 0 ? 'confirmed' : 'pending';

      const registration = await tx.eventRegistration.create({
        data: {
          userId,
          eventId,
          status: registrationStatus,
          quantity,
          price,
          totalPrice,
          pointsUsed,
          ...(couponId && { couponId }),
        },
        select: {
          id: true,
          quantity: true,
          price: true,
          totalPrice: true,
          pointsUsed: true,
          createdAt: true,
          status: true,
        },
      });

      await tx.event.update({
        where: { id: eventId },
        data: {
          availableSeats: event.availableSeats - quantity,
        },
      });

      return registration;
    });
  },

  getEventStats: async (
    eventId: number,
    organizerId: number,
    startDate?: string,
    endDate?: string
  ) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('Forbidden');
    }

    const whereClause: Record<string, unknown> = { eventId };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) (whereClause.createdAt as any).gte = new Date(startDate);
      if (endDate) (whereClause.createdAt as any).lte = new Date(endDate);
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: whereClause,
      select: {
        quantity: true,
        totalPrice: true,
        pointsUsed: true,
        createdAt: true,
      },
    });

    const totalAttendees = registrations.reduce(
      (sum, r) => sum + r.quantity,
      0
    );
    const totalRevenue = registrations.reduce(
      (sum, r) => sum + (r.totalPrice - r.pointsUsed),
      0
    );
    const totalRegistrations = registrations.length;

    const dailyStats = new Map<
      string,
      { registrations: number; revenue: number; attendees: number }
    >();

    registrations.forEach((reg) => {
      const date = reg.createdAt.toISOString().split('T')[0];
      if (date) {
        const existing = dailyStats.get(date) || {
          registrations: 0,
          revenue: 0,
          attendees: 0,
        };
        dailyStats.set(date, {
          registrations: existing.registrations + 1,
          revenue: existing.revenue + (reg.totalPrice - reg.pointsUsed),
          attendees: existing.attendees + reg.quantity,
        });
      }
    });

    return {
      totalAttendees,
      totalRevenue,
      totalRegistrations,
      averagePrice:
        totalRegistrations > 0
          ? Math.round(totalRevenue / totalRegistrations)
          : 0,
      dailyStats: Object.fromEntries(dailyStats),
    };
  },
};

// 💡 Cukup export langsung objek EventService-nya tanpa dibungkus Class lagi
export default EventService;