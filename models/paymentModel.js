const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
    number: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    trnx_id: {
        type: String,
        required: true
    },
    timestamps: {
        type: Date,
        default: Date.now
    }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;