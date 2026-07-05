import { randomBytes } from 'crypto';
import type { Prisma } from '@prisma/client';

export const REFERRAL_POINTS = 10_000;
export const REFERRAL_DISCOUNT_PERCENT = 10;
export const REFERRAL_EXPIRY_MONTHS = 3;

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase();
}

type TransactionClient = Prisma.TransactionClient;

export async function createUniqueReferralCode(
  tx: TransactionClient
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const referralCode = generateReferralCode();
    const existing = await tx.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });
    if (!existing) {
      return referralCode;
    }
  }
  throw new Error('Failed to generate referral code');
}
