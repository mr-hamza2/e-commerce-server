import express from 'express'
import { allUser, deleteUser, getUser, login, newUser, myProfile, logout, setProfile} from '../controllers/user.js';
import { adminOnly, middle, isAuthanticated} from '../middelwares/auth.js';

const app = express.Router();

app.post("/login", middle, login)

app.get("/logout", logout)

app.post("/new", newUser)

app.post("/profile",isAuthanticated, setProfile)

app.get("/me", isAuthanticated, myProfile)

app.get("/all", adminOnly, allUser)

app.route("/:id").get(getUser).delete( adminOnly, deleteUser)


export default app;