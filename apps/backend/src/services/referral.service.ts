import prisma from '../lib/prisma';
import { normalizeReferralCode } from '../utils/referral';

const ReferralService = {
  validateReferralCode: async (code: string) => {
    const normalizedCode = normalizeReferralCode(code);
    const referrer = await prisma.user.findUnique({
      where: { referralCode: normalizedCode },
      select: { id: true, name: true, referralCode: true },
    });

    if (!referrer) {
      throw new Error('Referral code not found');
    }

    return referrer;
  },
};

export default ReferralService;
