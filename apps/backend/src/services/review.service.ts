import prisma from '../lib/prisma';

export type CreateReviewInput = {
  rating: number;
  title: string;
  description?: string | null;
};

export type UpdateReviewInput = {
  rating?: number;
  title?: string;
  description?: string | null;
};

const ReviewService = {
  createReview: async (
    userId: number,
    eventId: number,
    data: CreateReviewInput
  ) => {
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        userId,
        eventId,
        status: 'active',
      },
    });

    if (!registration) {
      throw new Error('Only registered attendees can review events');
    }

    const existingReview = await prisma.eventReview.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingReview) {
      throw new Error('You have already reviewed this event');
    }

    if (data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (data.title.length < 1 || data.title.length > 100) {
      throw new Error('Title must be between 1 and 100 characters');
    }

    if (data.description && data.description.length > 1000) {
      throw new Error('Description must not exceed 1000 characters');
    }

    const createData: any = {
      userId,
      eventId,
      rating: data.rating,
      title: data.title,
    };

    if (data.description) {
      createData.description = data.description;
    }

    return prisma.eventReview.create({
      data: createData,
      select: {
        id: true,
        rating: true,
        title: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  getEventReviews: async (eventId: number, page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.eventReview.findMany({
        where: { eventId },
        select: {
          id: true,
          userId: true,
          rating: true,
          title: true,
          description: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.eventReview.count({ where: { eventId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  getReviewById: async (reviewId: number) => {
    const review = await prisma.eventReview.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        eventId: true,
        rating: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    return review;
  },

  updateReview: async (reviewId: number, userId: number, data: UpdateReviewInput) => {
    const review = await prisma.eventReview.findUnique({
      where: { id: reviewId },
      select: { userId: true },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('Forbidden: You can only edit your own reviews');
    }

    if (data.rating !== undefined) {
      if (data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
        throw new Error('Rating must be between 1 and 5');
      }
    }

    if (data.title !== undefined) {
      if (data.title.length < 1 || data.title.length > 100) {
        throw new Error('Title must be between 1 and 100 characters');
      }
    }

    if (data.description !== null && data.description && data.description.length > 1000) {
      throw new Error('Description must not exceed 1000 characters');
    }

    const updateData: Record<string, unknown> = {};
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.title !== undefined) updateData.title = data.title;
    if ('description' in data) updateData.description = data.description;

    return prisma.eventReview.update({
      where: { id: reviewId },
      data: updateData,
      select: {
        id: true,
        rating: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  deleteReview: async (reviewId: number, userId: number) => {
    const review = await prisma.eventReview.findUnique({
      where: { id: reviewId },
      select: { userId: true },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('Forbidden: You can only delete your own reviews');
    }

    await prisma.eventReview.delete({
      where: { id: reviewId },
    });

    return { success: true };
  },

  getEventStats: async (eventId: number) => {
    const reviews = await prisma.eventReview.findMany({
      where: { eventId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const totalRating = reviews.reduce((sum: number, r) => sum + r.rating, 0);
    const averageRating = Number((totalRating / reviews.length).toFixed(1));

    const distribution = {
      5: reviews.filter((r: any) => r.rating === 5).length,
      4: reviews.filter((r: any) => r.rating === 4).length,
      3: reviews.filter((r: any) => r.rating === 3).length,
      2: reviews.filter((r: any) => r.rating === 2).length,
      1: reviews.filter((r: any) => r.rating === 1).length,
    };

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution: distribution,
    };
  },

  getUserReview: async (userId: number, eventId: number) => {
    const review = await prisma.eventReview.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      select: {
        id: true,
        userId: true,
        rating: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return review;
  },
};

export default ReviewService;
