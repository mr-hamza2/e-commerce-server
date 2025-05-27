import { TryCatch } from "../middelwares/error.js";
import { Coupon } from "../models/coupon.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { stripe } from "../app.js";


const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  const user = await User.findById(id).select("name");
  if (!user) return next(new ErrorHandler("Please login first", 401));

  const { items, shippingInfo, coupon } = req.body;

  if (!items || !Array.isArray(items)) {
    return next(new ErrorHandler("Please send items", 400));
  }

  if (!shippingInfo) {
    return next(new ErrorHandler("Please send shipping info", 400));
  }

  let discountAmount = 0;

  if (coupon) {
    const discount = await Coupon.findOne({ code: coupon });
    if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));
    discountAmount = discount.amount;
  }


  const productIDs = items.map((item) => item._id);

  const products = await Product .find({ _id: { $in: productIDs } });

  const subtotal = products.reduce((prev, curr) => {
    const item = items.find((i) => i._id === curr._id.toString());
    if (!item) return prev;
    return curr.price * item.quantity + prev;
  }, 0);

  const tax = subtotal * 0.18;
  const shipping = subtotal > 1000 ? 0 : 200;
  const total = Math.round(subtotal + tax + shipping - discountAmount);

  
const stripeAmount = Math.round(total * 3.28); // or Math.floor()

const paymentIntent = await stripe.paymentIntents.create({
  amount: stripeAmount, // in the smallest currency unit, e.g., paise for INR
  currency: "inr",
  description: "MERN-Ecommerce",
  payment_method_types: ['card'], // explicitly allow card
  shipping: {
    name: user.name,
    address: {
      line1: shippingInfo.address,
      postal_code: shippingInfo.pinCode.toString(),
      city: shippingInfo.city,
      state: shippingInfo.state,
      country: shippingInfo.country,
    },
  },
  automatic_payment_methods: {
    enabled: false, // optional, since you’re specifying 'card' manually
  },
});



  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});



const newCoupon = TryCatch(async(req, res, next) => {
 
    const { code , amount} = req.body

  if (!code || !amount)
    return next(new ErrorHandler("Please enter both coupon and amount", 400));

     await Coupon.create({code, amount});

    return res.status(201).json({
        success: true,
        message: `Coupon ${code} Created Succesfully!`,
       })
})


const applyDiscount = TryCatch(async(req, res, next) => {
 
    const { coupon } = req.query;

  if (!coupon)
    return next(new ErrorHandler("Please enter coupon", 400));

    const discount = await Coupon.findOne({code: coupon});

    if (!discount)
      return next(new ErrorHandler("Invalid Coupon Code", 400));

    
    return res.status(200).json({
        success: true,
        discount: discount.amount,
        message: "Applied Coupon Successfully!",
        valid: true,
       })
})

const availbleCoupons = TryCatch(async(req, res, next) => {
 
    const coupons = await Coupon.find();

    const couponCodes = coupons? coupons : "No coupon availble"

      return res.status(200).json({
        success: true,
        couponCodes
       })
})


const allCoupons = TryCatch(async(req, res, next) => {
 
  const coupons = await Coupon.find({});

  const couponCounts = coupons.length;

  return res.status(200).json({
        success: true,
        coupons,
        couponCounts,
       })
})

const deleteCoupon = TryCatch(async(req, res, next) => {

  const { id } = req.params;
 
  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon)
    return next(new ErrorHandler("Coupon Not Found", 404));

  return res.status(200).json({
        success: true,
        message: `Coupon ${coupon.code} Deleted Successfully!`
       })
})


export { newCoupon, applyDiscount, allCoupons , deleteCoupon, createPaymentIntent, availbleCoupons};