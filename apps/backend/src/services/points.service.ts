import prisma from '../lib/prisma';
import {
  calculateCheckoutPrice,
  getActivePointEntries,
  getAvailableFromEntry,
  redeemPointsFifo,
  sumAvailablePoints,
} from '../utils/points';

const PointsService = {
  getPointsHistory: async (userId: number) => {
    const now = new Date();

    const entries = await prisma.pointEntry.findMany({
      where: { userId },
      select: {
        id: true,
        amount: true,
        usedAmount: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeEntries = entries.filter((entry) => entry.expiresAt > now);
    const pointsBalance = sumAvailablePoints(activeEntries);

    return {
      pointsBalance,
      entries: entries.map((entry) => ({
        ...entry,
        available: entry.expiresAt > now ? getAvailableFromEntry(entry) : 0,
        expired: entry.expiresAt <= now,
      })),
    };
  },

  previewCheckout: async (
    userId: number,
    input: { ticketPrice: number; pointsToUse?: number; couponId?: number }
  ) => {
    const now = new Date();
    const pointsToUse = input.pointsToUse ?? 0;

    const activeEntries = await getActivePointEntries(prisma, userId, now);
    const availablePoints = sumAvailablePoints(activeEntries);

    let couponPercent: number | undefined;

    if (input.couponId) {
      const coupon = await prisma.discountCoupon.findFirst({
        where: {
          id: input.couponId,
          userId,
          usedAt: null,
          expiresAt: { gt: now },
        },
      });

      if (!coupon) {
        throw new Error('Invalid or expired coupon');
      }

      couponPercent = coupon.percent;
    }

    const breakdown = calculateCheckoutPrice({
      ticketPrice: input.ticketPrice,
      pointsToUse,
      availablePoints,
      ...(couponPercent !== undefined && { couponPercent }),
    });

    return {
      ...breakdown,
      availablePoints,
      couponPercent: couponPercent ?? null,
    };
  },

  redeemPoints: async (userId: number, pointsToRedeem: number) => {
    return prisma.$transaction(async (tx) => {
      const result = await redeemPointsFifo(tx, userId, pointsToRedeem);
      const activeEntries = await getActivePointEntries(tx, userId);
      const remainingBalance = sumAvailablePoints(activeEntries);

      return {
        ...result,
        remainingBalance,
      };
    });
  },
};

export default PointsService;
