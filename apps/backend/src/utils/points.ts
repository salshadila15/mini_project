import type { Prisma } from '@prisma/client';

type TransactionClient = Prisma.TransactionClient;

export type PointEntryRow = {
  amount: number;
  usedAmount: number;
};

export function getAvailableFromEntry(entry: PointEntryRow): number {
  return Math.max(0, entry.amount - entry.usedAmount);
}

export function sumAvailablePoints(entries: PointEntryRow[]): number {
  return entries.reduce((total, entry) => total + getAvailableFromEntry(entry), 0);
}

export async function getActivePointEntries(
  tx: TransactionClient,
  userId: number,
  now = new Date()
) {
  return tx.pointEntry.findMany({
    where: {
      userId,
      expiresAt: { gt: now },
    },
    select: {
      id: true,
      amount: true,
      usedAmount: true,
      expiresAt: true,
    },
    orderBy: { expiresAt: 'asc' },
  });
}

export async function redeemPointsFifo(
  tx: TransactionClient,
  userId: number,
  pointsToRedeem: number,
  now = new Date()
): Promise<{ pointsRedeemed: number }> {
  if (pointsToRedeem <= 0) {
    return { pointsRedeemed: 0 };
  }

  const entries = await getActivePointEntries(tx, userId, now);
  const available = sumAvailablePoints(entries);

  if (pointsToRedeem > available) {
    throw new Error('Insufficient points balance');
  }

  let remaining = pointsToRedeem;

  for (const entry of entries) {
    if (remaining <= 0) {
      break;
    }

    const entryAvailable = getAvailableFromEntry(entry);
    if (entryAvailable <= 0) {
      continue;
    }

    const deduct = Math.min(entryAvailable, remaining);

    await tx.pointEntry.update({
      where: { id: entry.id },
      data: { usedAmount: entry.usedAmount + deduct },
    });

    remaining -= deduct;
  }

  return { pointsRedeemed: pointsToRedeem };
}

export function calculateCheckoutPrice(input: {
  ticketPrice: number;
  pointsToUse: number;
  availablePoints: number;
  couponPercent?: number;
}) {
  const { ticketPrice, pointsToUse, availablePoints, couponPercent } = input;

  if (ticketPrice < 0) {
    throw new Error('Ticket price must be non-negative');
  }

  if (pointsToUse < 0) {
    throw new Error('Points to use must be non-negative');
  }

  if (pointsToUse > availablePoints) {
    throw new Error('Insufficient points balance');
  }

  const couponDiscount =
    couponPercent && couponPercent > 0
      ? Math.floor((ticketPrice * couponPercent) / 100)
      : 0;

  const priceAfterCoupon = Math.max(0, ticketPrice - couponDiscount);
  const pointsUsed = Math.min(pointsToUse, priceAfterCoupon);
  const finalPrice = priceAfterCoupon - pointsUsed;

  return {
    ticketPrice,
    couponDiscount,
    priceAfterCoupon,
    pointsUsed,
    finalPrice,
  };
}
