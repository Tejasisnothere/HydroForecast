require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./middleware/auth"); // signup/login
const jwt = require("jsonwebtoken");
const axios = require("axios");

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
        req.user = decoded; // { id: user._id }
        next();
    } catch {
        res.redirect("/login");
    }
};

// Protected tanks routes
app.use("/api/tanks", verifyToken, require("./routes/tanks"));

// Example protected page
app.get("/dashboard", verifyToken, (req, res) => {
    res.render("dashboard", { userId: req.user.id });
});




app.listen(process.env.PORT || 5000, () =>
    console.log(`Server running on port ${process.env.PORT || 5000}`)
);
