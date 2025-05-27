import express from 'express';
import { deleteOrder, getAllOrders, getMyOrders, getSingleOrder, newOrder, processOrder } from '../controllers/orders.js';
import { adminOnly } from '../middelwares/auth.js';

const app = express.Router();

app.post("/new", newOrder);

app.get("/my", getMyOrders);

app.get("/all", adminOnly, getAllOrders);


app.route("/:id").get(getSingleOrder).put(adminOnly, processOrder).delete(adminOnly, deleteOrder);

export default app;