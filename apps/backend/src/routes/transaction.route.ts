import { Router } from 'express';
import { createTransaction, uploadPaymentProof, verifyTransaction, getPendingVerificationTransactions } from '../controllers/transaction.controller';
import { upload } from '../middlewares/multer.middleware';

// 💡 Ambil komponen modul secara spesifik dari objek yang diekspor
import * as authModules from '../middlewares/auth.middleware';

const router = Router();

// Tentukan fungsi middleware secara aman
const protect = (authModules as any).authMiddleware || authModules.default?.authMiddleware || authModules.default;

// Route 1: Buat transaksi (Wajib Login)
router.post('/', protect, createTransaction);

router.get('/pending-verification', protect, getPendingVerificationTransactions);

// Route 2: Upload bukti transfer (Wajib Login + Multer)
router.patch('/:id/upload', protect, upload.single('paymentProof'), uploadPaymentProof);

// Route 3: Verifikasi pembayaran
router.patch('/:id/verify', protect, verifyTransaction);

export default router;