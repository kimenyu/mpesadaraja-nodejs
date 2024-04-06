// Import Mongoose
const mongoose = require('mongoose');

// Define the Payment schema
const paymentSchema = new mongoose.Schema({
  MerchantRequestID: String,
  CheckoutRequestID: String,
  ResultCode: String,
  ResultDesc: String,
  Amount: String,
  MpesaReceiptNumber: String,
  TransactionDate: Date,
  PhoneNumber: String,
});

// Create the Payment model
const Payment = mongoose.model('Payment', paymentSchema);

// Export the Payment model
module.exports = Payment;
