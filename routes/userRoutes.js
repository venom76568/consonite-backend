const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require("../models/User");
const BlacklistTrying = require("../models/BlacklistTrying");
require("dotenv").config();

// Mocked blacklist data
const blacklist = require("../utils/blacklist.json");

// Email Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "consonitevnit@gmail.com, // Your email address
    pass: "spvqsitmxpgkrhyu", // Your email app password
  },
});

// Register User Endpoint
router.post("/register", async (req, res) => {
  const { name, email, phone, affiliation } = req.body;

  try {
    if (affiliation === "vnit") {
      const user = new User({ name, email, phone, affiliation });
      await user.save();
      return res.status(200).json({
        message:
          "Please collect your passes from VNIT canteen with a valid student ID card.",
      });
    }

    // Handle Non-VNIT users by sending OTP
    if (affiliation === "non_vnit") {
      const otp = Math.floor(100000 + Math.random() * 900000);

      // Send OTP via Email
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Your OTP Code for Consonite Website validation.",
        text: `Your OTP code is: ${otp}`,
      };

      await transporter.sendMail(mailOptions);

      return res
        .status(200)
        .json({ message: "Please check your email for the OTP.", otp });
    }
  } catch (error) {
    console.error("Error processing registration:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Verify OTP and Handle Blacklist Logic
router.post("/verify", async (req, res) => {
  const { otp, phone, name, email } = req.body;

  try {
    // Mock OTP validation for now
    const validOTP = parseInt(otp) === 123456; // Replace this with your OTP validation logic

    if (validOTP) {
      if (blacklist.includes(phone)) {
        // Log attempt in BlacklistTrying model
        const attempt = new BlacklistTrying({ name, email, phone });
        await attempt.save();

        return res.status(403).json({
          message: "Your email is not valid. Please use a different email.",
        });
      }

      // Valid user
      return res.status(200).json({
        message: "Please contact here to get your ticket.",
        whatsappLink: `https://wa.me/8805214581`,
      });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
