const express = require('express');
const cors = require('cors');
const compression = require('compression');

const User = require('./models/User');
const Lead = require('./models/Lead');
const Complaint = require('./models/Complaint');
const Order = require('./models/Order');
const StockItem = require('./models/StockItem');
const StockVoucher = require('./models/StockVoucher');
const QuotationTemplate = require('./models/QuotationTemplate');

const auth = require('./shared/middleware/auth');
const upload = require('./shared/middleware/upload');
const token = require('./shared/utils/token');
const pagination = require('./shared/utils/pagination');
const dashCache = require('./shared/utils/dashboardCache');
const mail = require('./shared/utils/mail');
const { sendError } = require('./shared/utils/sendError');

const { createAuthModule } = require('./modules/auth');
const { createUsersModule } = require('./modules/users');
const { createLeadsModule } = require('./modules/leads');
const { createStockModule } = require('./modules/stock');
const { createQuotationsModule } = require('./modules/quotations');
const { createComplaintsModule } = require('./modules/complaints');
const { createOrdersModule } = require('./modules/orders');
const { createDashboardModule } = require('./modules/dashboard');

function createApp() {
  const app = express();
  app.set('etag', false);
  app.use(compression());

  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
    : [];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    maxAge: 86400,
  }));
  app.use(express.json());
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  // Wire feature modules (composition root)
  app.use('/api/auth', createAuthModule({ User, auth, token }));
  app.use('/api/users', createUsersModule({ User, auth, dashCache, token, pagination }));
  app.use('/api/leads', createLeadsModule({ Lead, User, auth, dashCache, token, upload }));
  app.use('/api/stock', createStockModule({ StockItem, StockVoucher, auth, dashCache, pagination, upload }));
  app.use('/api/quotations', createQuotationsModule({ QuotationTemplate, auth }));
  app.use('/api/complaints', createComplaintsModule({ Complaint, User, auth, mail, pagination }));
  app.use('/api/orders', createOrdersModule({ Order, User, auth, pagination }));
  app.use('/api/dashboard', createDashboardModule({
    Lead, User, StockItem, StockVoucher, QuotationTemplate, auth, dashCache,
  }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'SolarJi API' }));

  app.use((err, req, res, next) => {
    sendError(res, err, 'Server error. Please try again.');
  });

  return app;
}

module.exports = { createApp };
