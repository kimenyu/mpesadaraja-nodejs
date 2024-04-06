const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Payment = require('./models/paymentModel');

const app = express();
require("dotenv").config();
const cors = require('cors');
const port = process.env.PORT;

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
    });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});


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
        console.log(token);
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
            CallBackURL: 'https://mpesadaraja-nodejs.onrender.com/callback',
            AccountReference: "Moja Nexus",
            TransactionDesc: "Paid online",

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


app.post('/callback', async (req, res) => {
    try{

       
            //callback details
    
            const {
                MerchantRequestID,
                CheckoutRequestID,
                ResultCode,
                ResultDesc,
                CallbackMetadata
                     }   = req.body.Body.stkCallback
    
        //     get the meta data from the meta
            const meta = Object.values(await CallbackMetadata.Item)
            const PhoneNumber = meta.find(o => o.Name === 'PhoneNumber').Value.toString()
            const Amount = meta.find(o => o.Name === 'Amount').Value.toString()
            const MpesaReceiptNumber = meta.find(o => o.Name === 'MpesaReceiptNumber').Value.toString()
            const TransactionDate = meta.find(o => o.Name === 'TransactionDate').Value.toString()
    
            // do something with the data
            console.log("-".repeat(20)," OUTPUT IN THE CALLBACK ", "-".repeat(20))
            console.log(`
                MerchantRequestID : ${MerchantRequestID},
                CheckoutRequestID: ${CheckoutRequestID},
                ResultCode: ${ResultCode},
                ResultDesc: ${ResultDesc},
                PhoneNumber : ${PhoneNumber},
                Amount: ${Amount}, 
                MpesaReceiptNumber: ${MpesaReceiptNumber},
                TransactionDate : ${TransactionDate}
            `)
    
            res.json(true)
    
        }catch (e) {
            console.error("Error while trying to update LipaNaMpesa details from the callback",e)
            res.status(503).send({
                message:"Something went wrong with the callback",
                error : e.message
            })
        }    
});
