import crypto from 'crypto';
import Payment from '../models/Payment.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// New Payment Route
export const newPayment = async (req, res) => {
  try {
    const { name, identity, paymentAmount } = req.body;

    const merchantTransactionId = `txn_${Date.now()}`;
    const merchantUserId = `MUID_${Date.now()}`;

    const data = {
      merchantId: process.env.MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: merchantUserId,
      amount: paymentAmount * 100,
      redirectUrl: "https://webhook.site/redirect-url",
      redirectMode: "REDIRECT",
      callbackUrl: process.env.CALLBACK_URL,
      paymentInstrument: { type: "PAY_PAGE" },
      mobileNumber: "9999999999",
    };

    const payload = JSON.stringify(data);
    const payloadBase64 = Buffer.from(payload).toString('base64');
    const xVerify = generateXVerify(payloadBase64, process.env.SALT_KEY, process.env.SALT_INDEX);

    const options = {
      method: 'POST',
      url: 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay',
      headers: {
        'Content-Type': 'application/json',
        'X-MERCHANT-ID': process.env.MERCHANT_ID,
        'X-SALT-KEY': process.env.SALT_KEY,
        'X-VERIFY': xVerify,
      },
      data: {
        request: payloadBase64,
      },
    };

    axios.request(options)
      .then(function (response) {
        console.log(response.data);
        if (response.data.success === true) {
          const payment = new Payment({
            name,
            identity,
            paymentAmount,
            paymentStatus: 'Pending',
            transactionId: merchantTransactionId,
            phonePeResponse: response.data,
          });

          payment.save();
          res.status(200).json({ message: 'Payment initiated successfully', redirectUrl: response.data.data.instrumentResponse.redirectInfo.url });
        } else {
          res.status(400).json({ message: 'Payment failed', data: response.data });
        }
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).json({ message: 'Error during payment processing', error });
      });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: error.message,
      success: false,
    });
  }
};

// Check Payment Status Route
export const checkStatus = async (req, res) => {
  const { merchantTransactionId, merchantId } = req.body;

  const keyIndex = process.env.SALT_INDEX;
  const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + process.env.SALT_KEY;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  const checksum = sha256 + "###" + keyIndex;

  const options = {
    method: 'GET',
    url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'X-MERCHANT-ID': process.env.MERCHANT_ID,
    },
  };

  axios.request(options)
    .then(async (response) => {
      if (response.data.success === true) {
        const url = `http://localhost:3000/success`;
        return res.redirect(url);
      } else {
        const url = `http://localhost:3000/failure`;
        return res.redirect(url);
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: 'Error checking payment status', error });
    });
};

// Helper function to generate X-VERIFY checksum
const generateXVerify = (payloadBase64, saltKey, saltIndex) => {
  const data = `${payloadBase64}/pg/v1/pay${saltKey}`;
  const checksum = crypto.createHash('sha256').update(data).digest('hex');
  return `${checksum}###${saltIndex}`;
};
