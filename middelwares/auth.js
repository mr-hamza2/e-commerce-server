import jwt from 'jsonwebtoken';
import { TryCatch } from "./error.js";
import { User } from '../models/user.js';
import { ErrorHandler } from '../utils/errorHandler.js';



const adminOnly = TryCatch(async(req, res, next)=>{
    
    const { id } = req.query;
    
    if(!id) {
        return next(new ErrorHandler("You are not loggedIn", 401))
    }
    
    const user = await User.findById(id);
    if(!user) {
        return next(new ErrorHandler("Please firstly SignUp", 401))
    }
    if(user.role !== "admin"){
        return next(new ErrorHandler("You are unable to access this route", 403))
    }
    next()
})

const isAuthanticated = (req,res,next) => {
    
    const token = req.cookies["E-commerce"];

    if (!token) {
        return next(new ErrorHandler("please login to access this page",401))
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET)
       
    req.user = decodedData._id

    
    next();
}


const middle = TryCatch(async (req, res, next) => {
  const users = await User.find({ dob: { $exists: false } });

  for (const user of users) {
    user.dob = "Mon Jan 01 1900 00:00:00 GMT+0428 (Pakistan Standard Time)";
    await user.save();
  }
  next();
});


export {adminOnly, middle, isAuthanticated}