import prisma from '../lib/prisma';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { REFERRAL_DISCOUNT_PERCENT } from '../utils/referral';

// 1. MEMBUAT TRANSAKSI (STATUS: PENDING)
export const createTransaction = async (req: any, res: Response) => {
  const { eventId, quantity } = req.body;
  const userId = req.user?.id; // Pastikan kamu sudah punya authMiddleware yang mengisi req.user

console.log("=== DEBUG TRANSAKSI ===");
console.log("Isi req.user", req.user);
console.log("Isi userId", userId);

  try {
    // Cek ketersediaan event
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) }
    });

    if (!event) {
      return res.status(404).json({ message: "Event tidak ditemukan" });
    }

    if (event.availableSeats < quantity) {
      return res.status(400).json({ message: "Maaf, sisa kursi tidak mencukupi" });
    }

    // Hitung total harga
    const totalPrice = event.price * quantity;
    const status = totalPrice === 0 ? 'SUCCESS' : 'PENDING'; // Jika gratis, langsung sukses

    // Buat data transaksi pending
    const transaction = await prisma.transaction.create({
      data: {
        userId: Number(userId),
        eventId: Number(eventId),
        quantity: Number(quantity),
        totalPrice: totalPrice,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      message: "Transaksi berhasil dibuat, silakan upload bukti pembayaran",
      data: transaction
    });
  } catch (error: any) {
    res.status(500).json({ message: "Gagal membuat transaksi", error: error.message });
  }
};

// 2. UPLOAD BUKTI TRANSFER (STATUS: WAITING_VERIFICATION)
export const uploadPaymentProof = async (req: Request, res: Response) => {
  const { id } = req.params;
  const fileName = req.file?.filename; // Diambil dari middleware Multer

  if (!fileName) {
    return res.status(400).json({ message: "File bukti transfer wajib diunggah" });
  }

  try {
    const updatedTransaction = await prisma.transaction.update({
      where: { id: Number(id) },
      data: {
        paymentProof: fileName,
        status: 'WAITING_VERIFICATION' // Status naik kelas
      }
    });

    res.json({
      message: "Bukti transfer berhasil diunggah, menunggu verifikasi pihak Organizer",
      data: updatedTransaction
    });
  } catch (error: any) {
    res.status(500).json({ message: "Gagal mengunggah bukti transfer", error: error.message });
  }
};

// 4. AMBIL DAFTAR TRANSAKSI YANG MENUNGGU VERIFIKASI (UNTUK ORGANIZER)
export const getPendingVerificationTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'WAITING_VERIFICATION' // 💡 Hanya ambil yang sudah upload bukti transfer
      },
      orderBy: {
        id: 'desc' // Menampilkan transaksi terbaru di paling atas
      }
    });

    res.json({
      message: "Berhasil mengambil data verifikasi transaksi",
      data: transactions
    });
  } catch (error: any) {
    res.status(500).json({ message: "Gagal mengambil data transaksi", error: error.message });
  }
};

// 3. VERIFIKASI OLEH ORGANIZER (STATUS: SUCCESS & POTONG KURSI / FAILED)
export const verifyTransaction = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; // Harus berisi string "APPROVE" atau "REJECT"

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) }
    });

    if (!transaction || transaction.status !== 'WAITING_VERIFICATION') {
      return res.status(400).json({ message: "Transaksi tidak valid atau tidak butuh verifikasi saat ini" });
    }

    if (action === 'REJECT') {
      await prisma.transaction.update({
        where: { id: Number(id) },
        data: { status: 'FAILED' }
      });
      return res.json({ message: "Transaksi pembayaran ditolak oleh Organizer" });
    }

    // 💡 JIKA APPROVE: Gunakan ACID Transaction agar status sukses & potong kursi berjalan serentak
    await prisma.$transaction(async (tx) => {
      // A. Ubah status transaksi jadi SUCCESS
      await tx.transaction.update({
        where: { id: Number(id) },
        data: { status: 'SUCCESS' }
      });

      // B. Potong kuota kursi Event secara otomatis
      await tx.event.update({
        where: { id: transaction.eventId },
        data: {
          availableSeats: {
            decrement: transaction.quantity // Mengurangi jumlah kursi sesuai tiket yang dibeli
          }
        }
      });
    });

    res.json({ message: "Pembayaran berhasil diverifikasi, kuota tiket resmi berkurang!" });
  } catch (error: any) {
    res.status(500).json({ message: "Gagal memverifikasi transaksi", error: error.message });
  }
};
