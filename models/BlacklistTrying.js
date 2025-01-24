const mongoose = require("mongoose");

const blacklistTryingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  attemptedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BlacklistTrying", blacklistTryingSchema);
