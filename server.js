require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const cors = require('cors');
const compression = require('compression');

const connectDB = require('./config/db');
const { attachUser } = require('./middleware/auth');
const { helmetConfig, sanitize, generalLimiter } = require('./middleware/security');
const { attachCsrfToken, verifyCsrfToken } = require('./middleware/csrf');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
connectDB();

app.set('view engine', 'ejs');
app.set('trust proxy', 1);

// Performance
app.use(compression());

// Security
app.use(helmetConfig);
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(generalLimiter);

// Body Parsers & Static Files
app.use(express.static('public', { maxAge: '1d' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(sanitize);
app.use(methodOverride('_method'));

// Session Store Configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

// Custom Application Middleware
app.use(attachUser);
app.use(attachCsrfToken);
app.use(verifyCsrfToken);

// SEO Routes (Unscoped/Static Content)
app.use('/', require('./routes/seoRoutes'));

// Main Application Routes
app.use('/', require('./routes/productRoutes'));
app.use('/', require('./routes/categoryRoutes'));
app.use('/', require('./routes/authRoutes'));
app.use('/', require('./routes/profileRoutes'));
app.use('/', require('./routes/addressRoutes'));
app.use('/', require('./routes/wishlistRoutes'));
app.use('/', require('./routes/questionRoutes'));
app.use('/', require('./routes/compareRoutes'));
app.use('/', require('./routes/reviewRoutes'));
app.use('/', require('./routes/cartRoutes'));
app.use('/', require('./routes/orderRoutes'));
app.use('/', require('./routes/returnRoutes'));
app.use('/', require('./routes/sellerRoutes'));
app.use('/', require('./routes/adminRoutes'));
app.use('/', require('./routes/couponRoutes'));
app.use('/', require('./routes/supportRoutes'));
app.use('/', require('./routes/notificationRoutes'));

// Background Jobs
require('./services/stockReservationJob').start();
const sellerController = require('./controllers/sellerController');
setInterval(sellerController.releaseEligibleSettlements, 60 * 60 * 1000);
console.log('🔄 Settlement release job started (runs hourly)');

// Error Handling (Must remain last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 NOVA MARKET running at http://localhost:${PORT}`));