const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Signup page
router.get("/signup", (req, res) => {
    res.render("signup", { errors: [] });
});

// Logout
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});


// Login page
router.get("/login", (req, res) => {
    res.render("login", { errors: [] });
});

// Signup POST
router.post(
    "/signup",
    [
        body("email").isEmail().withMessage("Enter a valid email"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.render("signup", { errors: errors.array() });

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (user) return res.render("signup", { errors: [{ msg: "Email already registered" }] });

            user = new User({ name, email, password });
            await user.save();

            res.redirect("/login");
        } catch (err) {
            console.error(err);
            res.render("signup", { errors: [{ msg: "Server error" }] });
        }
    }
);

const redirectIfLoggedIn = (req, res, next) => {
    const token = req.cookies.token;
    if (token) return res.redirect("/dashboard");
    next();
};

router.get("/signup", redirectIfLoggedIn, (req, res) => {
    res.render("signup", { errors: [] });
});

router.get("/login", redirectIfLoggedIn, (req, res) => {
    res.render("login", { errors: [] });
});


// Login POST
router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Enter a valid email"),
        body("password").exists().withMessage("Password is required")
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.render("login", { errors: errors.array() });

        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });
            if (!user) return res.render("login", { errors: [{ msg: "Invalid credentials" }] });

            const isMatch = await user.comparePassword(password);
            if (!isMatch) return res.render("login", { errors: [{ msg: "Invalid credentials" }] });

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.cookie("token", token, { httpOnly: true });
            res.redirect("/dashboard");
        } catch (err) {
            console.error(err);
            res.render("login", { errors: [{ msg: "Server error" }] });
        }
    }
);

module.exports = router;
