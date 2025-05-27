import { myCache } from "../app.js";
import { TryCatch } from "../middelwares/error.js";
import { Product } from "../models/product.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { deleteFromCloudinary, invalidateCache, uploadFileToCloudinary } from "../utils/feature.js";
import { Wishlist } from "../models/wishlist.js";



const newProduct = TryCatch(async(req, res, next) => {

    const {name, category, price,  stock, details} = req.body;
    const photo = req.file

    

    if(!name || !category || !price || !stock || !details){
        return next(new ErrorHandler("Please Fill All Fields", 404))
    }

    if (!photo) {
        return next(new ErrorHandler("Please Upload Photo", 400))
      }

    const result = await uploadFileToCloudinary(photo);

let parsedDetails;
try {
  parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
} catch (err) {
  return next(new ErrorHandler("Invalid details format", 400));
}

await Product.create({
  name,
  category: category.toUpperCase(),
  price,
  stock,
  photo: result,
  details: parsedDetails,
});




    invalidateCache({product : true, admin: true});

    return res.status(200).json({
        success: true,
        message: "Product Created Successfully!"
      })

} )


const getLatestProduct = TryCatch(async(req, res, next) => {

  let products;

  if(myCache.has("latest-products")){
    products = JSON.parse(myCache.get("latest-products"))
  }
  else{
    products = await Product.find({}).sort({createdAt: -1}).limit(8);
    myCache.set("latest-products", JSON.stringify(products))
  }

    return res.status(200).json({
        success: true,
        products,
      })

} )

const getAllCategories= TryCatch(async(req, res, next) => {

  let categories;

  if(myCache.has("categories")){
    categories = JSON.parse(myCache.get("categories"))
  }
  else{
    categories = await Product.distinct("category")
    myCache.set("categories", JSON.stringify(categories))
  }

    return res.status(200).json({
        success: true,
        categories,
      })

} )

const getAdminProducts = TryCatch(async(req, res, next) => {
  
  let products;

  if(myCache.has("all-products")){
    products = JSON.parse(myCache.get("all-products"))
  }
  else{
    products = await Product.find({})
    myCache.set("all-products", JSON.stringify(products))
  }

   return res.status(200).json({
       success: true,
       products,
     })

} )

const getSingleProduct = TryCatch(async(req, res, next) => {
   
   const id = req.params.id
   let product;

  if(myCache.has(`product-${id}`)){
    product = JSON.parse(myCache.get(`product-${id}`))
  }
  else{
    product = await Product.findById(id)

    if(!product){
      return next(new ErrorHandler("Product Not Found",404))
    }

    myCache.set((`product-${id}`), JSON.stringify(product))
  }

   return res.status(200).json({
       success: true,
       product,
     })

} )

const wishlistProduct = TryCatch(async (req, res, next) => {
  const {userId, wishlist, productId } = req.body;

  if (!userId || typeof wishlist === "undefined" || !productId) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  const fav = await Wishlist.findOne({ productId, userId });

  if (fav) {
    await fav.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Product removed from Favourites",
    });
  } else {
    await Wishlist.create({
      userId,
      productId,
      wishlist,
    });

    return res.status(200).json({
      success: true,
      message: "Product added to Favourites",
    });
  }
});



const allWishlistProducts = TryCatch(async(req, res, next) => {
     
  const { productId , userId } = req.query;

  if(productId ) { /// its only used when userID not available
    
     const wish = await Wishlist.findOne({productId});


     return res.status(200).json({
       success: true,
       wish,
     })
  }

  if(!userId){
    return next(new ErrorHandler("userId missing", 404))
  }


const favourites = await Wishlist.find({ userId, wishlist: true }).populate('productId');

    if(!favourites ) {

       return res.status(200).json({
       success: true,
       favourites: false
     })   

    }

       return res.status(200).json({
       success: true,
       favourites,
     })

} )

const updateProduct = TryCatch(async(req, res, next) => {

  const { id } = req.params

  const {name, category, price,  stock} = req.body;
  const photo = req.file

  if(!name && !category && !price && !stock && !photo){
    return next(new ErrorHandler("Nothing to Update", 400))
}

  const product = await Product.findById(id)

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404))
  }

  if (photo) {
    await deleteFromCloudinary(product.photo.image_id);
    const result = await uploadFileToCloudinary(photo);
    product.photo = result;
  }

  if(name) product.name = name;
  if(price) product.price = price;
  if(stock) product.stock = stock;
  if(category) product.category = category;

  await product.save();

  invalidateCache({product : true, admin: true,  productId: String(product._id) });


  return res.status(200).json({
      success: true,
      message: "Product Updated Successfully!"
    })

} )


const deleteProduct = TryCatch(async(req, res, next) => {
   
  const id = req.params.id
  const product = await Product.findById(id)

 if (!product) {
  return next(new ErrorHandler("Product Not Found", 404))
}

  await deleteFromCloudinary(product.photo.image_id)
  
  await product.deleteOne();

  invalidateCache({product : true, admin: true,  productId: String(product._id) });

  return res.status(200).json({
      success: true,
      message: "Product Deleted Successfully!"
    })

} )

const searchAllProduct = TryCatch(async(req, res, next) => {

  const {search, category, price,  sort} = req.query;

  console.log(sort)

  const page = Number(req.query.page) || 1;
  const limit = Number(process.env.LIMIT) || 12;
  const skip = (page -1) * limit;

  const baseQuery = {}

  if(search){
   baseQuery.name = {
    $regex: search ,
     $options: "i"
    }
  }

  if(price)  
      baseQuery.price = {
      $lte: Number(price),
    }

    console.log(category)

  if(category){

       baseQuery.category = category;

  }  
  
  const [products, filterProducts] = await Promise.all([
    await Product.find(baseQuery)
      .sort( sort && {price: sort === "asc" ? 1 : -1})
      .limit(limit)
      .skip(skip),
    await Product.find(baseQuery)
  ])

  const totalPages = Math.ceil(filterProducts.length / limit);

   return res.status(200).json({
       success: true,
       products,
       totalPages,
     })

} )

export {
  newProduct,
  getLatestProduct,
  getAllCategories, 
  getAdminProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  searchAllProduct,
  wishlistProduct,
  allWishlistProducts,
}