import express, { json } from 'express'
import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import cors from 'cors'
import CookieParser from 'cookie-parser'
import registerRoute from './route/user.route.js'
import vivaRoute from './route/viva.route.js'
import VivaResult from './route/vivaresult.route.js'
import classRoute from './route/class.route.js'
import connectDB from './config/connectDB.js'
import lectureRoute from './route/lecture.route.js'
import commentRoute from './route/comment.route.js'
import assignmentRoute from './route/assignment.route.js'
import postRoute from './route/post.route.js'
import timetableRoute from './route/timetable.route.js'
import quizRoute from './route/quiz.route.js'
import QuizResult from './route/quizresult.route.js'
import Dashbaord from './route/dashboard.route.js'
import MeetLink from './route/meetlink.route.js'
import projectRoutes from './route/projectRoutes.js' 

// Allowed origins for CORS (production + development)
const Frontend_URL = process.env.Frontend_URL || 'http://localhost:5173'
const allowedOrigins = [
  Frontend_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://major-project-sem-8.vercel.app',
]

connectDB()

const app = express()
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(CookieParser())
app.use('/uploads', express.static('uploads'))

const PORT = process.env.PORT || 4000

app.use('/user', registerRoute)
app.use('/viva', vivaRoute)
app.use('/vivaresult', VivaResult)
app.use('/class', classRoute)
app.use('/lecture', lectureRoute)
app.use('/comment', commentRoute)
app.use('/assignment', assignmentRoute)
app.use('/post', postRoute)
app.use('/quiz',quizRoute)
app.use('/quizresult',QuizResult);
app.use('/dashboard',Dashbaord)
app.use('/meetlink',MeetLink);
app.use('/api/projects', projectRoutes)
app.listen(PORT, () => {
  console.log(`server run on port ${PORT}`)
})
