const express = require("express");

const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT;

app.listen(port, () => {
  console.log(`app is running at localhost:${port}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("<h1>Hello from Orem</h1>");
});

// middleware function to generate token
const generateToken = async (req, res, next) => {
  const consumerSecret = process.env.MPESA_SEC_KEY;
  const consumerKey = process.env.MPESA_CONSUMER_KEY;

  const auth = new Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );

  await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        authorization: `Basic ${auth}`,
      },
    }
  );
};

app.post("/stk", generateToken, async (req, res) => {
  const phone = req.body.phone.substring(1);
  const amount = req.body.amount;

  const date = new Date();
  const timestamp =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + (date.getDate() + 1)).slice(-2) +
    ("0" + (date.getHours() + 1)).slice(-2) +
    ("0" + (date.getMinutes() + 1)).slice(-2) +
    ("0" + (date.getSeconds() + 1)).slice(-2);

  const shortCode = process.env.MPESA_PAYBILL;
  const passKey = process.env.PASS_KEY;

  const password = new Buffer.from(shortCode + passKey + timestamp).toString(
    "base64"
  );

  await axios
    .post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortCode, // store number not till number
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline", // CustomerBuyGoodsOnline
        Amount: amount,
        PartyA: `254${phone}`, // the user
        PartyB: shortCode, // the shortcode receiving the money
        PhoneNumber: `254${phone}`,
        CallBackURL: "https://mydomain.com/pat",
        AccountReference: "Test Orem Paid", // or `254${phone}`
        TransactionDesc: "Test",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    .then((data) => {
      console.log(data);
      res
        .status(200)
        .json(data)
        .catch((err) => {
          console.log(err.message);
          res.status(400).json(err.message);
        });
    });
});
