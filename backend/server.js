require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const jwt = require("jsonwebtoken");

const app = express();
connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../public/views"));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Auth routes
app.use("/", authRoutes);

// Middleware for protected routes
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.redirect("/login");
    }
};

// Protected route
app.get("/dashboard", verifyToken, (req, res) => {
    res.render("dashboard", { email: req.user.id });
});

const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
    console.warn("⚠️  JWT_SECRET is not set. Set it in your .env file for secure tokens.");
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
