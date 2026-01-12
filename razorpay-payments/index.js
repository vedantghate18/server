import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const app = express();
app.use(express.json());

// Razorpay keys
const razorpayKeyId = "";
const razorpaySecretKey = "";

// Razorpay instance
const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpaySecretKey,
});

// =======================
// CREATE ORDER
// =======================
app.post("/create-order", async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    if (!req.body || !req.body.amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const rupees = Number(amount);
    const paise = Math.round(rupees * 100);
    if (isNaN(paise) || paise <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const order = await razorpay.orders.create({
      amount: paise,
      currency: "INR",
      receipt: "donation_receipt",
    });

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =======================
// VERIFY PAYMENT
// =======================
app.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", razorpaySecretKey)
      .update(body)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      return res.json({
        success: false,
        message: "Invalid signature",
      });
    }
  } catch (error) {
    console.error("VERIFY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =======================
// START SERVER
// =======================
app.listen(3000, () => {
  console.log("✅ Server running on port 3000");
});
