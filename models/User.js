const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  affiliation: { type: String, required: true }, // 'vnit' or 'non_vnit'
});

module.exports = mongoose.model("User", userSchema);
