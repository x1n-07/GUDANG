import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import companyRoutes from './routes/companies.js';
import goodsRoutes from './routes/goods.js';
import equipmentRoutes from './routes/equipment.js';
import vehicleRoutes from './routes/vehicles.js';
import technicianRoutes from './routes/technicians.js';
import dashboardRoutes from './routes/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3008;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for easier dev, enable properly in prod if needed
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());

// General Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti' }
});
app.use('/api', generalLimiter);

// Specific Login Rate Limiting (Strict)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan login, silakan coba lagi dalam 15 menit' }
});

// Routes
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/goods', goodsRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve static files in production / docker container
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
