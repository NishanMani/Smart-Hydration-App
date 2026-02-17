import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { connectDB } from './config/db.js'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import waterRoutes from './routes/waterLogRoutes.js'
import reminderRoutes from './routes/reminderRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger/index.js";
import './cron/reminderCron.js';

dotenv.config()
await connectDB()

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(
  cors({                              //Which frontend is allowed to call your backend.         
    origin: "http://localhost:3000",  //Only allow requests coming from this frontend.
    credentials: true,                //Allow cookies,session,AH to be sent in cross-origin requests.  
  })
);

app.get('/', (req, res) => {
  res.send('API is running...')
})  
app.use('/api/auth',authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/water',waterRoutes)
app.use('/api/analytics',analyticsRoutes)
app.use('/api/reminder',reminderRoutes)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const PORT =  5000 || process.env.PORT

app.listen(PORT, () => {
console.log(`Server is running on http://localhost:${PORT}`)
})
