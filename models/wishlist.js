import { model, Schema, Types } from "mongoose";

const schema = new Schema(
  {
 productId: {
      type: Types.ObjectId,
      ref: "Product", // Reference to the Product model
      required: [true, "Please Enter Product Id"],
    },    wishlist: {
      type: Boolean,
      default: false,
    },
    userId:{
      type: String,
      required: [true, "Please Enter User Id"],
    }
    
  },
  {
    timestamps: true,
  }
);

export const Wishlist = model("Wishlist", schema);
