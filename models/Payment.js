import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  identity: { type: String, required: true },
  paymentAmount: { type: Number, required: true },
  paymentStatus: { type: String, required: true },
  transactionId: { type: String, required: true },
  phonePeResponse: { type: Object, required: true },
}, { timestamps: true });

export default mongoose.model('Payment', PaymentSchema);
