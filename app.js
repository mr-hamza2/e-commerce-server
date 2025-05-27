import express from 'express'
import userRoutes from './routes/user.js'
import productRoutes from './routes/product.js'
import ordersRoutes from './routes/orders.js'
import paymentRoutes from './routes/payment.js'
import dashboardRoutes from './routes/adminStats.js'
import { connectDB } from './utils/feature.js';
import dotenv from 'dotenv';
import { errorMiddelware } from './middelwares/error.js';
import cookieParser from 'cookie-parser';
import {v2 as cloudinary } from 'cloudinary'
// import { generateRandomProducts } from './seeders/product.js';
import NodeCache from 'node-cache'
import morgan  from 'morgan';
import Stripe from 'stripe'
import cors from 'cors'


dotenv.config({
    path: './.env'
})

// generateRandomProducts()

const corsOptions ={              /// cors (cross origin requests) means helping in different host platform working together
    origin: [process.env.CLIENT_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const app = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI  || "mongodb+srv://Hamza:H%40mza064@e-commerce.chfuzua.mongodb.net/"
const stripeKey = process.env.STRIPE_KEY || "dfdifjdjfij@@fkdjfkdjfkjdkfk";

connectDB(mongoURI)

app.use(express.urlencoded({ extended: true }));


app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"))
app.use(cors(corsOptions))

export const myCache = new NodeCache();
export const stripe = new Stripe(stripeKey);


app.use("/api/v1/user", userRoutes)
app.use("/api/v1/product", productRoutes)
app.use("/api/v1/order", ordersRoutes)
app.use("/api/v1/payment", paymentRoutes)
app.use("/api/v1/dashboard", dashboardRoutes)




app.use(errorMiddelware)

app.listen(port, ()=>{
    console.log(`server is listening on port ${port}`)
})
