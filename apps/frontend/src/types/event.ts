export type Event = {
  id: number;
  name: string;
  description: string;
  price: number;
  date: string;
  location: string;
  category: string;
  availableSeats: number;
  image: string | null;
  organizerId?: number;
  createdAt: string;
  updatedAt: string;
};

export type EventRegistration = {
  id: number;
  userId: number;
  user: {
    name: string;
    email: string;
  };
  quantity: number;
  price: number;
  totalPrice: number;
  pointsUsed: number;
  status: string;
  createdAt: string;
};

export type EventStats = {
  totalAttendees: number;
  totalRevenue: number;
  totalRegistrations: number;
  averagePrice: number;
  dailyStats: Record<
    string,
    {
      registrations: number;
      revenue: number;
      attendees: number;
    }
  >;
};

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

export type EventResponse<T = Event> = {
  message: string;
  data: T;
};

export type EventListResponse = {
  message: string;
  data: Event[];
};

export type EventRegistrationsResponse = {
  message: string;
  data: EventRegistration[];
};

export type EventStatsResponse = {
  message: string;
  data: EventStats;
};

export type EventReview = {
  id: number;
  userId: number;
  rating: number;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

export type CreateReviewInput = {
  rating: number;
  title: string;
  description?: string;
};

export type UpdateReviewInput = Partial<CreateReviewInput>;

export type ReviewStats = {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
};

export type EventReviewsResponse = {
  message: string;
  data: {
    reviews: EventReview[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
};

export type ReviewStatsResponse = {
  message: string;
  data: ReviewStats;
};

export type CreateReviewResponse = {
  message: string;
  data: EventReview;
};
