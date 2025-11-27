const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const dotenv = require("dotenv");

dotenv.config();

const config = require("./config");
const database = require("./database");
const adminAuth = require("./adminAuth");
const verificationRoutes = require("./routes/verification");
const adminRoutes = require("./routes/admin");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

// In production (Render), trust the first proxy so secure cookies work correctly
if (config.isProd) {
  app.set("trust proxy", 1);
}

app.use(express.static(path.join(__dirname, "..", "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure session store based on environment
let sessionStore;
if (process.env.DATABASE_URL) {
  // Use PostgreSQL session store for production
  const pgSession = require('connect-pg-simple')(session);
  sessionStore = new pgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
  });
  console.log('Using PostgreSQL session store');
} else {
  // Use MemoryStore for local development only
  console.log('Using MemoryStore for sessions (development only)');
}

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "mcube-verify-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.isProd,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use("/", verificationRoutes);
app.use("/", adminRoutes);

app.use((err, req, res, next) => {
  // Log all errors to help with debugging
  console.error('=== ERROR ===');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('=============');
  
  const status = 500;
  const message =
    config.nodeEnv === "development"
      ? String(err && err.message ? err.message : "Unexpected error")
      : "An error occurred while processing your request.";
  res.status(status);
  res.render("error", {
    message,
    borrowersPortalUrl: config.app.borrowersPortalUrl,
  });
});

const port = config.port;

// Initialize database and server in correct order
async function startServer() {
  try {
    // 1. Initialize database tables first
    await database.initializeDatabase();
    console.log('Database initialization complete');
    
    // 2. Initialize default admin user
    await adminAuth.initializeDefaultAdmin();
    
    // 3. Start the server
    app.listen(port, () => {
      console.log(
        `Selfie verification service listening on port ${port} in ${config.nodeEnv} mode`
      );
      console.log(`Admin panel: ${config.app.baseUrl}/admin/dashboard`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
