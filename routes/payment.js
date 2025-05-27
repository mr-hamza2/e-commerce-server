import express from 'express';
import { adminOnly, isAuthanticated } from '../middelwares/auth.js';
import { allCoupons, applyDiscount, deleteCoupon, newCoupon, createPaymentIntent, availbleCoupons } from '../controllers/payment.js';

const app = express.Router();

app.post("/create",  createPaymentIntent);

app.get("/discount",  isAuthanticated, applyDiscount);

app.get("/coupons",  isAuthanticated, availbleCoupons);

app.use(adminOnly);

app.post("/coupon/new", newCoupon);

app.get("/coupon/all", allCoupons);

app.delete("/:id", deleteCoupon);


export default app;