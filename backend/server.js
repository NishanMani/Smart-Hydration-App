import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { connectDB } from './config/db.js'
import cookieParser from 'cookie-parser'
import session from "express-session";
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import waterRoutes from './routes/waterLogRoutes.js'
import reminderRoutes from './routes/reminderRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
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

app.use(
  session({                           //Encrypt and sign session ID
    secret: process.env.SESSION_SECRET,
    resave: false,                    //Don’t save session again if nothing changed.
    saveUninitialized: false,         //Don’t create session until something stored.
    cookie: {
      httpOnly: true,
      secure: false, 
      maxAge: 24 * 60 * 60 * 1000
    }
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

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
console.log(`Server is running on http://localhost:${PORT}`)
})
