export type UserRole = 'CUSTOMER' | 'ORGANIZER';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  referralCode: string;
};

export type DiscountCoupon = {
  id: number;
  percent: number;
  expiresAt: string;
};

export type UserProfile = AuthUser & {
  pointsBalance: number;
  activeCoupons: DiscountCoupon[];
};

export type PointEntry = {
  id: number;
  amount: number;
  usedAmount: number;
  available: number;
  expired: boolean;
  expiresAt: string;
  createdAt: string;
};

export type LoginResponse = {
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
};

export type RegisterResponse = {
  message: string;
  data: AuthUser & {
    welcomeCoupon?: {
      percent: number;
      expiresAt: string;
    };
  };
};

export type MeResponse = {
  message: string;
  data: UserProfile;
};

export type PointsHistoryResponse = {
  message: string;
  data: {
    pointsBalance: number;
    entries: PointEntry[];
  };
};

export type ReferralValidationResponse = {
  message: string;
  data: {
    id: number;
    name: string;
    referralCode: string;
  };
};
