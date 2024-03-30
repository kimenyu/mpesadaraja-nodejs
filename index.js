const express = require('express');
const axios = require('axios');

const app = express();
require("dotenv").config();
const cors = require('cors');

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World');
});

// app.get('/token', async (req, res) => {
//     generateToken();
// });

const generateToken = async (req, res, next) => {
    const auth = new Buffer.from(`${process.env.SAFARICOM_CONSUMER_KEY}:${process.env.SAFARICOM_CONSUMER_SECRET}`).toString('base64');

    await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
        headers: {
            authorization: `Basic ${auth}`
        },
    }
    ).then((response) => {
        // console.log(data.data.access_token);
        token = response.data.access_token;
        next();
    }).catch((err) => {
        console.log(err);
    })
}

app.post ("/stk", generateToken, async(req, res) => {
    const phone = req.body.phone;
    const amount = req.body.amount;


    const date = new Date();

    const timestamp = 
    date.getFullYear().toString() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

    const password = new Buffer.from(process.env.BUSINESS_SHORT_CODE + process.env.PASS_KEY + timestamp).toString('base64');


    await axios.post (
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
            BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phone, // Use the tenant's phone number here
            PartyB: process.env.BUSINESS_SHORT_CODE,
            PhoneNumber: phone,
            CallBackURL: 'https://nodejs-daraja.onrender.com//callback',
            AccountReference: "Moja Nexus",
            TransactionDesc: "Paid online"
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    ).then ((data) => {
        res.status(200).json(data.data);
    }).catch((err) => {
        console.log(err.message);
    })
})

app.post("/callback", (req, res) => {
    const callbackData = req.body;
    console.log(callbackData);
    res.status(200).send('Callback received');
})