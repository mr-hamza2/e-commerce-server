import mongoose from "mongoose"
import jwt from 'jsonwebtoken'
import { getBase64 } from "../lib/helper.js";
import {v2 as cloudinary } from 'cloudinary'
import { Product } from "../models/product.js";
import { myCache } from "../app.js";
import { ErrorHandler } from "./errorHandler.js";


const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    httpOnly: true,
    secure: true,
};

const connectDB = (uri)=>{
    mongoose.connect(uri,{dbName: "E-commerce"})
    .then((data) => console.log(`connected to DB : ${data.connection.host}`))
    .catch((err)=> {throw err})
}

const sendToken = (res, user, code, message) =>{
    const token = jwt.sign({_id: user._id}, (process.env.JWT_SECRET))

   
    return res.status(code).cookie("E-commerce", token, cookieOptions).json({
        success: true,
        user,
        message
    })

}

const invalidateCache = ({product, order, admin, userId, orderId, productId}) => {

    if(product){
        
        const productKeys = ["latest-products", "categories", "all-products"]

        if (typeof productId === "string") productKeys.push(`product-${productId}`);

        if (typeof productId === "object")
          productId.forEach((i) => productKeys.push(`product-${i}`));
        
        myCache.del(productKeys)
        
    }

    if(order){

        const orderKeys = [`all-orders`, `my-orders-${userId}`, `order-${orderId}`]
       
        myCache.del(orderKeys)
    } 
    
    if (admin) {
     myCache.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }
}

const reduceStock = async (orderItems) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order._id);
    if (!product) throw new Error("Product Not Found");
    product.stock -= order.quantity;
    await product.save();
  }
};


const calculatePercentage = (currMonth, lastMonth) => {
  if (lastMonth === 0) {
    // If lastMonth was 0 and current is also 0, change is 0%
    if (currMonth === 0) return 0;
    // If lastMonth was 0 but now we have something, it's 100%+ increase
    return 100;
  }

  const percentChange = ((currMonth - lastMonth) / lastMonth) * 100;
  return Number(percentChange.toFixed(0));
};



const getInventories = async(categories = [], productsCounts )=>{
    

      const categoriesCountPromise = categories.map((category) => Product.countDocuments({category}))
    
              const categoriesCount = await Promise.all(categoriesCountPromise)
    
              const categoryCount = [];
    
               categories.forEach((category , i) => {
                 categoryCount.push({
                    [category] : Math.round((categoriesCount[i] / productsCounts) * 100)
                 })
              })
            
              return categoryCount; 
}

const getChartData = ({ length, docArr, today, property }) => {
  const data = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = new Date(i.createdAt);
    const monthDiff = (today.getFullYear() - creationDate.getFullYear()) * 12 + (today.getMonth() - creationDate.getMonth());

    if (monthDiff >= 0 && monthDiff < length) {
      const index = length - monthDiff - 1;
      if (property) {
        data[index] += i[property];
      } else {
        data[index] += 1;
      }
    }
  });

  return data;
};



const uploadFileToCloudinary = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(
            getBase64(file),
            { resource_type: "auto" }
        );

        return {
            url: result.secure_url,
            image_id: result.public_id,
        };

    } catch (error) {
        throw new Error("Failed to upload file to Cloudinary: " + error.message);
    }
};


const deleteFromCloudinary = async (filePublicId) => {
    try {
        const result = await cloudinary.uploader.destroy(filePublicId);
        console.log("Delete result:", result);
        return result;
    } catch (error) {
        throw new Error("Failed to delete file from Cloudinary: " + error.message);
    }
};





export {
    connectDB, 
    sendToken, 
    uploadFileToCloudinary, 
    deleteFromCloudinary, 
    invalidateCache, 
    reduceStock,
    calculatePercentage,
    getInventories,
    getChartData,
    cookieOptions,
};