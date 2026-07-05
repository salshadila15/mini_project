import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import AuthRouter from './routes/auth.route';
import EventRouter from './routes/event.route';
import TransactionRouter from './routes/transaction.route'; // Import route transaksi
import { formatZodIssues, validate } from './middlewares/validator.middleware';
import path from 'path';
import fs from 'fs';
import sendMail from './helpers/send-mail';
import { loginSchema } from './schemas/auth.schema';
import SendMail from './helpers/send-mail';
import cloudinary from './helpers/cloudinary'; 
import { upload } from './middlewares/multer.middleware';

const app: Application = express();
const PORT = Number(process.env.PORT) || 8000;

// Create uploads directory if it doesn't exist
const uploadPath = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadPath));

app.get('/ping', (_req: Request, res: Response) => {
  res.send('pong!');
});

app.post('/send-email', async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        message: 'Validation error',
        errors: {
          email: !email ? ['Email wajib diisi'] : undefined,
          name: !name ? ['Nama wajib diisi'] : undefined,
        }
      });
  }

  const sender = {
    address: "admin@eventhub.com",
    name: "EventHub Admin"
  };

  await SendMail(
    sender,
    [email],
    "Welcome to EventHub",
    `Hello ${name}, welcome to EventHub!`,
  );

  res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/upload-test', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
  }

  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'eventhub-images',
  });

  fs.unlinkSync(req.file.path); // Hapus file lokal setelah diunggah ke Cloudinary

  return res.json({
    message: 'Upload ke Cloudinary berhasil',
    secure_url: result.secure_url,
    public_id: result.public_id,
  });

} catch (error) {
  console.error("Error upload ke Cloudinary", error);

  if (req.file && fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
  }

  return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.use('/api/auth', AuthRouter);
app.use('/api/events', EventRouter);
app.use('/api/transactions', TransactionRouter); // Import route transaksi

// 404 — must be after all routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler — must have 4 arguments
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(422).json({
      message: 'Validation error',
      errors: formatZodIssues(err),
    });
  }

  const e = err as {
    stack?: string;
    status?: number;
    message?: string;
    errors?: unknown;
  };

  console.error(e.stack ?? err);
  return res.status(e.status ?? 500).json({
    message: e.message ?? 'Internal Server Error',
    errors: e.errors ?? [],
  });
});

// Vercel imports `app` as a serverless handler — do not call listen there
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(
      `Server running at http://localhost:${PORT}`
    );
  });
}

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/uploads/proofs', express.static(path.join(process.cwd(), '../uploads/proofs')));

export default app;
