const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Signup
router.get("/signup", (req, res) => {
    res.render("signup", { errors: [] }); 
});

router.get("/login", (req, res) => {
    res.render("login", { errors: [] }); 
});

router.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;
    const errors = [];

    // Basic validations
    if (!name || !email || !password) {
        errors.push({ msg: "All fields are required" });
    }
    if (password && password.length < 8) {
        errors.push({ msg: "Password must be at least 8 characters" });
    }

    if (errors.length > 0) {
        return res.render("signup", { errors });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            errors.push({ msg: "Email already registered" });
            return res.render("signup", { errors });
        }

        user = new User({ name, email, password });
        await user.save();

        res.redirect("/login");
    } catch (err) {
        errors.push({ msg: "Server error" });
        res.render("signup", { errors });
    }
});


router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const errors = [];

    try {
        const user = await User.findOne({ email });
        if (!user) {
            errors.push({ msg: "Invalid email or password" });
            return res.render("login", { errors });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            errors.push({ msg: "Invalid email or password" });
            return res.render("login", { errors });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h"
        });

        res.cookie("token", token, { httpOnly: true });
        res.redirect("/dashboard");
    } catch (err) {
        errors.push({ msg: "Server error" });
        res.render("login", { errors });
    }
});


// Logout
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});



module.exports = router;
