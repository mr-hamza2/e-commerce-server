import express from 'express'
import { getAdminDashboardStats, getBarChart, getLineChart, getPieChart } from '../controllers/stats.js';
import { adminOnly } from '../middelwares/auth.js';

const app = express.Router();

app.use(adminOnly)

app.get("/stats", getAdminDashboardStats)

app.get("/pie", getPieChart)

app.get("/bar", getBarChart)

app.get("/line", getLineChart)

export default app;