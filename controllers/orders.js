import { myCache } from "../app.js";
import { TryCatch } from "../middelwares/error.js";
import { Orders } from "../models/orders.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { invalidateCache, reduceStock } from "../utils/feature.js";


const newOrder = TryCatch(async (req, res, next) => {
  let {
    shippingInfo,
    orderItems,
    user,
    subtotal,
    tax,
    shippingCharges,
    discount,
    total,
  } = req.body;

console.log(shippingInfo,
    orderItems)

  if (
    !shippingInfo ||
    !Array.isArray(orderItems) || !orderItems.length ||
    !user ||
    subtotal == null ||
    tax == null ||
    shippingCharges == null ||
    discount == null ||
    total == null
  ) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }

  const order = await Orders.create({
    shippingInfo,
    orderItems,
    user,
    subtotal,
    tax,
    shippingCharges,
    discount,
    total,
  });

      await reduceStock(orderItems);

      await invalidateCache({
    order: true,
    product: true,
    admin: true,
    userId: user,
    productId: order.orderItems.map((i) => String(i._id)),
  });



  return res.status(201).json({
    success: true,
    message: "Order Placed Successfully!",
  });
});


const processOrder = TryCatch(async(req, res, next) => {

    const { id } = req.params;

    const order = await Orders.findById(id);
        
    if(!order){
        return next(new ErrorHandler("Order Not Found",404))
    }

    switch (order.status) {
        case 'Processing':
            order.status = "Shipped";
            break;
        case 'Shipped':
            order.status = "Delivered";
            break;
        default:
            order.status = "Delivered";
            break;
    }

    await order.save();
 
    invalidateCache({
        order: true,
        product: false,
        admin: true,
        userId: order.user,
        orderId: order._id,
    })
    
   return res.status(200).json({
    success: true,
    message: "Order Processed Succesfully!",
   })

})

const deleteOrder = TryCatch(async(req, res, next) => {

    const { id } = req.params;

    const order = await Orders.findById(id);
        
    if(!order){
        return next(new ErrorHandler("Order Not Found",404))
    }

    await order.deleteOne();
 
    invalidateCache({
        order: true,
        product: false,
        admin: true,
        userId: order.user,
        orderId: order._id
    })

   return res.status(200).json({
    success: true,
    message: "Order Deleted Succesfully!",
   })

})


const getMyOrders = TryCatch(async(req, res, next)=> {

    const { id:user} = req.query;

    let orders = [];

    if(myCache.has(`my-orders-${user}`)){
       orders = JSON.parse(myCache.get(`my-orders-${user}`))
    }
    else{
        orders = await Orders.find({user: user})
        myCache.set(`my-orders-${user}`, JSON.stringify(orders))
    }

    return res.status(200).json({
        success: true,
        orders,
       })
})


const getAllOrders = TryCatch(async(req, res, next)=> {

    const key = `all-orders`

    let orders = [];

    if(myCache.has(key)){
       orders = JSON.parse(myCache.get(key))
    }
    else{
        orders = await Orders.find().populate("user","name").sort({createdAt: -1});
        myCache.set(key, JSON.stringify(orders))
    }

    const orderCounts = orders.length;

      invalidateCache({
        order: true,
        product: false,
        admin: true,
    })

    return res.status(200).json({
        success: true,
        orders,
        orderCounts,
       })

})


const getSingleOrder = TryCatch(async(req, res, next)=> {

    const { id } = req.params;

    const key = `order-${id}`

    console.log(id)

    let order;

    if(myCache.has(key)){
       order = JSON.parse(myCache.get(key))
    }
    else{
          order = await Orders.findById(id)
            .populate("user", "name")
            .populate("orderItems.productId", "name photo");
        
        if(!order){
            return next(new ErrorHandler("Order Not Found",404))
        }

        myCache.set(key, JSON.stringify(order))
    }

    return res.status(200).json({
        success: true,
        order,
       })

})


export {newOrder, getMyOrders, getAllOrders, getSingleOrder, processOrder, deleteOrder}