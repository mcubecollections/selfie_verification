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

app.use(express.static(path.join(__dirname, "..", "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
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

adminAuth.initializeDefaultAdmin().then(() => {
  app.listen(port, () => {
    console.log(
      `Selfie verification service listening on port ${port} in ${config.nodeEnv} mode`
    );
    console.log(`Admin panel: ${config.app.baseUrl}/admin/dashboard`);
  });
});
