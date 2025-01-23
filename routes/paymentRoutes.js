// // import express from 'express'; // Use 'import' instead of 'require'
// // import fetch from 'node-fetch'; // 'node-fetch' now supports ES Modules
// // import Payment from '../models/Payment.js'; // Ensure to include '.js' for local imports

// // const router = express.Router();

// // // PhonePe UAT endpoint and Salt Key from .env
// // const { MERCHANT_ID, SALT_KEY, CALLBACK_URL } = process.env;

// // router.post('/payment', async (req, res) => {
// //   const { name, identity, paymentAmount } = req.body;

// //   const requestPayload = {
// //     merchantId: MERCHANT_ID,
// //     transactionId: `txn_${Date.now()}`,
// //     amount: paymentAmount * 100, // Convert to paise
// //     currency: 'INR',
// //     cardNumber: '4208585190116667',
// //     cardType: 'CREDIT_CARD',
// //     cardIssuer: 'VISA',
// //     expiryMonth: 6,
// //     expiryYear: 2027,
// //     cvv: '508',
// //     callbackUrl: CALLBACK_URL,
// //   };

// //   try {
// //     const response = await fetch('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json',
// //         'X-MERCHANT-ID': MERCHANT_ID,
// //         'X-SALT-KEY': SALT_KEY,
// //       },
// //       body: JSON.stringify(requestPayload),
// //     });

// //     const data = await response.json();

// //     if (response.ok) {
// //       // Save payment details to MongoDB
// //       const payment = new Payment({
// //         name,
// //         identity,
// //         paymentAmount,
// //         paymentStatus: 'Pending', // Initially set to 'Pending'
// //         transactionId: requestPayload.transactionId,
// //         phonePeResponse: data,
// //       });

// //       await payment.save();
// //       res.status(200).json({ message: 'Payment initiated successfully', data });
// //     } else {
// //       res.status(400).json({ message: 'Payment failed', data });
// //     }
// //   } catch (error) {
// //     res.status(500).json({ message: 'Error processing payment', error });
// //   }
// // });

// // // Callback endpoint for PhonePe to send payment response
// // router.post('/callback', async (req, res) => {
// //   const paymentData = req.body;

// //   // Find the payment by transactionId and update its status
// //   const payment = await Payment.findOne({ transactionId: paymentData.transactionId });

// //   if (payment) {
// //     payment.paymentStatus = paymentData.status === 'SUCCESS' ? 'Completed' : 'Failed';
// //     await payment.save();
// //     res.status(200).json({ message: 'Payment status updated' });
// //   } else {
// //     res.status(404).json({ message: 'Payment not found' });
// //   }
// // });

// // export default router; // Use 'export default' instead of 'module.exports'
// import express from 'express';
// import fetch from 'node-fetch';
// import crypto from 'crypto';
// import Payment from '../models/Payment.js';  // Ensure Payment model is correct

// const router = express.Router();
// const { MERCHANT_ID, SALT_KEY, CALLBACK_URL, SALT_INDEX } = process.env;

// // Payment Route
// router.post('/payment', async (req, res) => {
//   const { name, identity, paymentAmount } = req.body;

//   // Validate input
//   if (!name || !identity || !paymentAmount) {
//     return res.status(400).json({ message: 'Name, Identity, and Payment Amount are required' });
//   }

//   // Generate unique transaction ID and user ID
//   const merchantTransactionId = `txn_${Date.now()}`;
//   const merchantUserId = `MUID_${Date.now()}`;

//   // Prepare the request payload for PhonePe
//   const requestPayload = {
//     merchantId: MERCHANT_ID,
//     merchantTransactionId: merchantTransactionId,
//     merchantUserId: merchantUserId,
//     amount: paymentAmount * 100, // Convert to paise
//     redirectUrl: "https://webhook.site/redirect-url", // Replace with actual redirect URL
//     redirectMode: "REDIRECT",
//     callbackUrl: CALLBACK_URL,
//     paymentInstrument: { type: "PAY_PAGE" },
//     mobileNumber: "9999999999", // Optional mobile number
//   };

//   // Generate the X-VERIFY header for security
//   const xVerify = generateXVerify(requestPayload, SALT_KEY, SALT_INDEX);

//   try {
//     // Send the payment request to PhonePe
//     const response = await fetch('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'X-MERCHANT-ID': MERCHANT_ID,
//         'X-SALT-KEY': SALT_KEY,
//         'X-VERIFY': xVerify,
//       },
//       body: JSON.stringify(requestPayload),
//     });

//     const data = await response.json();

//     // If the payment request was successful, save the payment data to the database
//     if (response.ok) {
//       const payment = new Payment({
//         name,
//         identity,
//         paymentAmount,
//         paymentStatus: 'Pending',
//         transactionId: merchantTransactionId,
//         phonePeResponse: data,
//       });

//       await payment.save();
//       res.status(200).json({ message: 'Payment initiated successfully', data });
//     } else {
//       // Handle failed payment request
//       res.status(400).json({ message: 'Payment failed', data });
//     }
//   } catch (error) {
//     console.error('Error during payment processing:', error);
//     res.status(500).json({ message: 'Error processing payment', error });
//   }
// });

// // Callback Route
// router.post('/callback', async (req, res) => {
//   const paymentData = req.body;

//   // Check if the payment exists in the database
//   const payment = await Payment.findOne({ transactionId: paymentData.transactionId });

//   if (payment) {
//     // Update payment status based on the response from PhonePe
//     payment.paymentStatus = paymentData.status === 'SUCCESS' ? 'Completed' : 'Failed';
//     await payment.save();
//     res.status(200).json({ message: 'Payment status updated' });
//   } else {
//     res.status(404).json({ message: 'Payment not found' });
//   }
// });

// // Helper function to generate the X-VERIFY checksum
// const generateXVerify = (payload, saltKey, saltIndex) => {
//   const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
//   const data = `${payloadBase64}/pg/v1/pay${saltKey}`;
//   const checksum = crypto.createHash('sha256').update(data).digest('hex');
//   return `${checksum}###${saltIndex}`;
// };

// export default router;

import express from 'express';
import { newPayment, checkStatus } from '../controller/paymentController.js'; // Correct way to import the functions
const router = express.Router();

router.post('/payment', newPayment);
router.post('/status/:txnId', checkStatus);

export default router; // Use 'export default' for ES Module syntax
