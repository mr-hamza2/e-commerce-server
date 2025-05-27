import express from 'express'
import { singleUpload } from '../middelwares/multer.js';
import { 
    allWishlistProducts,
    deleteProduct,
     getAdminProducts, 
     getAllCategories,
     getLatestProduct, 
     getSingleProduct, 
     newProduct, 
     searchAllProduct, 
     updateProduct, 
     wishlistProduct
    } from '../controllers/product.js';
import { adminOnly } from '../middelwares/auth.js';

const app = express.Router();

app.post("/new", adminOnly, singleUpload, newProduct)

app.get("/latest", getLatestProduct)

app.get("/all", searchAllProduct)

app.post("/wish", wishlistProduct)

app.get("/fav", allWishlistProducts)

app.get("/categories", getAllCategories)

app.get("/admin-products", adminOnly, getAdminProducts)

app.route("/:id")
        .get(getSingleProduct)
        .put(adminOnly, singleUpload, updateProduct)
        .delete(adminOnly, deleteProduct)

export default app;