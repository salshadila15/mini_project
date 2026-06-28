import { UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { compare, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  addMonths,
  createUniqueReferralCode,
  normalizeReferralCode,
  REFERRAL_DISCOUNT_PERCENT,
  REFERRAL_EXPIRY_MONTHS,
  REFERRAL_POINTS,
} from '../utils/referral';
import { getAvailableFromEntry } from '../utils/points';

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  referralCode?: string | undefined;
};

const AuthService = {
  register: async (data: RegisterInput) => {
    const { name, email, password, role, referralCode } = data;

    return await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('Email already exists');
      }

      let referrer: { id: number } | null = null;
      const inputReferralCode = referralCode?.trim();
      if (inputReferralCode) {
        const normalizedCode = normalizeReferralCode(inputReferralCode);
        referrer = await tx.user.findUnique({
          where: { referralCode: normalizedCode },
          select: { id: true },
        });

        if (!referrer) {
          throw new Error('Invalid referral code');
        }
      }

      const hashedPassword = await hash(password, 10);
      const newReferralCode = await createUniqueReferralCode(tx);
      const expiresAt = addMonths(new Date(), REFERRAL_EXPIRY_MONTHS);

      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          referralCode: newReferralCode,
          ...(referrer && { referredById: referrer.id }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          referralCode: true,
        },
      });

      let welcomeCoupon: { percent: number; expiresAt: Date } | null = null;

      if (referrer) {
        await tx.pointEntry.create({
          data: {
            userId: referrer.id,
            amount: REFERRAL_POINTS,
            expiresAt,
          },
        });

        const coupon = await tx.discountCoupon.create({
          data: {
            userId: newUser.id,
            percent: REFERRAL_DISCOUNT_PERCENT,
            expiresAt,
          },
        });

        welcomeCoupon = {
          percent: coupon.percent,
          expiresAt: coupon.expiresAt,
        };
      }

      return {
        ...newUser,
        ...(welcomeCoupon && { welcomeCoupon }),
      };
    });
  },

  login: async (data: { email: string; password: string }) => {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
      },
    };
  },

  getMe: async (userId: number) => {
    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        referralCode: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const [pointEntries, activeCoupons] = await Promise.all([
      prisma.pointEntry.findMany({
        where: { userId, expiresAt: { gt: now } },
        select: { amount: true, usedAmount: true },
      }),
      prisma.discountCoupon.findMany({
        where: {
          userId,
          usedAt: null,
          expiresAt: { gt: now },
        },
        select: {
          id: true,
          percent: true,
          expiresAt: true,
        },
        orderBy: { expiresAt: 'asc' },
      }),
    ]);

    const pointsBalance = pointEntries.reduce(
      (total, entry) => total + getAvailableFromEntry(entry),
      0
    );

    return {
      ...user,
      pointsBalance,
      activeCoupons,
    };
  },

  getAllUsers: async () => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, referralCode: true, role: true },
    });
    return users;
  },
};

export default AuthService;
