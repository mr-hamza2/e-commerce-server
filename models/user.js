import { model, Schema  } from "mongoose";
import validator from 'validator'
import { hash } from 'bcrypt';


const schema = new Schema({
    name:{
        type: String,
        required : [true, "Please Enter Name"],
    },
    gender: {
        type: String,
        enum: ["male", "female","not"],
        required: [true, "Please Enter Gender"],
      },
    photo: {
        type: String,
        required: [true, "Please Upload Photo"],
      },
    dob: {
        type: Date,
        // required: [true, "Please Enter Date of Birth"],
    },
    role:{
        type: String,
        enum : ["admin", "user"],   
        default: "user",
    },
    email:{
        type: String,
        required : [true, "Please Enter Email"],
        unique: [true, "Email Already Exist"],
        validate: validator.default.isEmail,
    },
    password:{
        type: String,
        required : [true, "Please Enter Password"],
        default: "not",
        select: false,
    }, 

},
{
    timestamps: true,
 } 
)


schema.pre("save", async function (next) {

    if (!this.isModified('password')) return next()  // only hash the password if it's being updated
    this.password = await hash(this.password, 10)
})


schema.virtual("age").get(function () {
    const today = new Date();
    const dob = this.dob;
    let age = today.getFullYear() - dob.getFullYear();
  
    if (
      today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
    ) {
      age--;
    }
  
    return age;
  });


export const User = model("User", schema)