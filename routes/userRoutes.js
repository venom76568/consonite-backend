const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require("../models/User");
const BlacklistTrying = require("../models/BlacklistTrying");
const cors = require("cors");
// Mocked blacklist data
const blacklist = require("../utils/blacklist.json");

// Email Config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Save VNIT user
router.post("/register", async (req, res) => {
  const { name, email, phone, affiliation } = req.body;

  if (affiliation === "vnit") {
    const user = new User({ name, email, phone, affiliation });
    await user.save();
    return res.status(200).json({
      message:
        "Please collect your passes from VNIT canteen with a valid student ID card.",
    });
  }

  // If Non-VNIT, send OTP
  if (affiliation === "non_vnit") {
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}`,
    };
    transporter.verify((error, success) => {
      if (error) {
        console.error("Transporter verification failed:", error);
      } else {
        console.log("Transporter is ready to send emails.");
      }
    });

    transporter.sendMail(mailOptions, async (error) => {
      try {
        await transporter.sendMail(mailOptions);
        req.session = { otp, email, phone, name };
        res
          .status(200)
          .json({ message: "Please check your email for the OTP." });
      } catch (error) {
        console.error("Error sending email:", error);
        res
          .status(500)
          .json({ message: "Error sending OTP. Please try again." });
      }
    });
  }
});

// Verify OTP and handle blacklist logic
router.post("/verify", async (req, res) => {
  const { otp, phone, name, email } = req.body;

  if (parseInt(otp) === req.session.otp) {
    if (blacklist.includes(phone)) {
      // Log to blacklist_trying database
      const attempt = new BlacklistTrying({ name, email, phone });
      await attempt.save();
      return res.status(403).json({
        message: "Your email is not valid. Please use a different email.",
      });
    }

    // Non-blacklisted user
    return res.status(200).json({
      message: "Please contact here to get your ticket.",
      whatsappLink: `https://wa.me/8805214581`,
    });
  } else {
    return res.status(400).json({ message: "Invalid OTP. Please try again." });
  }
});

module.exports = router;
