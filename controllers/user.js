import { compare } from "bcrypt";
import { TryCatch } from "../middelwares/error.js";
import { User } from "../models/user.js";
import { sendEmail } from "../utils/email.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { cookieOptions, sendToken } from "../utils/feature.js";


const newUser = TryCatch(async(req, res, next)=>{

    const { name , email, photo, gender, password, dob} = req.body

    
    let user = await User.findOne({email: email});

    if (user){
         return  sendToken(res, user, 201, `Welcome Back ${user.name}`);
        }

      if (!name || !email || !gender || !password)
        return next(new ErrorHandler("Please add all fields", 400));


     user = await User.create({ name, email, photo, gender, dob, password })
     
     console.log(user)

      await sendEmail({
    to: user.email,
    subject: "Login Notification",
    text: `Hi ${user.name},\n\nYou have successfully logged in to your Lootlo account.\n\nIf this wasn't you, please secure your account immediately.`,
  });


     sendToken(res, user, 201, `Successfully Signup ${user.name}!`);
})

const login = TryCatch(async (req, res, next) => {

  const { email, password } = req.body;

  if (!email)
    return next(new ErrorHandler("Please enter email", 400));

  if (!password)
    return next(new ErrorHandler("Please enter password", 400));


  const user = await User.findOne({ email }).select("+password")

  if (!user) {
    return next(new ErrorHandler("You are not SignUp", 404));
  }

    const isMatch = await compare(password, user.password)
  if (!isMatch) { 
    return  next(new ErrorHandler("Invalid  password",404))
  }

  //  await sendEmail({
  //   to: user.email,
  //   subject: "Login Notification",
  //   text: `Hi ${user.name},\n\nYou have successfully logged in to your Lootlo account.\n\nIf this wasn't you, please secure your account immediately.`,
  // });

  sendToken(res, user, 200, `Welcome Back ${user.name}`);
});


const logout = TryCatch(async (req, res) => {

  console.log("logout!")

    res
    .status(200)
    .clearCookie("E-commerce", {
      ...cookieOptions,
      expires: new Date(0), 
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logout successfully!",
    });
});




const myProfile = TryCatch(async (req, res, next) => {


  const user = await User.findById(req.user);

  if (!user) {
    return next(new ErrorHandler("user not found",404))
  }

  res.status(200).json({
    success: true,
    user,
  })
});


const setProfile = TryCatch(async (req, res, next) => {

   
  const {password , dob, gender} = req.body;

  console.log(password , dob, gender)

  const user = await User.findById(req.user);

  if (!dob || !gender || !password){
      return next(new ErrorHandler("Please add all fields", 400))
  }

  if (!user) {
    return next(new ErrorHandler("user not found",404))
  }

  user.password = password;
  user.gender = gender;
  user.dob = dob;

    await user.save(); 


  res.status(200).json({
    success: true,
    message: "Profile is Compeleted!",
    user,
  })
});


const allUser = TryCatch(async(req, res, next)=>{
  
    const  users = await User.find();

    return res.status(200).json({
        success: true,
        users
      })
})


const getUser = TryCatch(async(req, res, next)=>{

    const id = req.params.id
  
    const  user = await User.findById(id);

    if(!user){
      return next(new ErrorHandler("Invalid Id", 400));
    }

    return res.status(200).json({
        success: true,
        user
      })
})


const deleteUser = TryCatch(async (req, res, next) => {
  const id = req.params.id;

  const user = await User.findById(id); 
   

  if (!user) {
    return next(new ErrorHandler("Invalid Id", 400));
  }

  await User.deleteOne({ _id: id });

  return res.status(200).json({
    success: true,
    message: "User deleted successfully!"
  });
});




export {newUser, allUser, getUser, deleteUser, login, myProfile, logout, setProfile};