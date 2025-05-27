import { model, Schema } from "mongoose";

const schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Name"],
    },
    photo:{
       url:{
         type: String,
        required : [true, "Please Enter Photo"],
    }, 
     image_id: {
        type: String,
        required: true
      }
    },
    price: {
      type: Number,
      required: [true, "Please Enter Price"],
    },
    stock: {
      type: Number,
      required: [true, "Please Enter Stock"],
    },
    category: {
      type: String,
      required: [true, "Please Enter Category"],
      trim: true,
    },
    details: {
      info: {
        type: String,
        required: [true, "Please Enter Details"],
      },
      colors: {
        type: Array,
        required: [true, "Please Enter Color"],
      },
      size: {
        type: Array, 
      },
      model: {
        type: String,
      },
         category: {
      type: String,
      required: [true, "Please Enter Category"],
      trim: true,
         },
      rating: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Product = model("Product", schema);
