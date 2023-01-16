const express = require('express')
const dotenv = require('dotenv').config()
const connectDB = require('./config/connection')
const colors = require('colors')
const cors = require('cors')
const errorHandler = require('./middleware/errorMiddleware')
const userRoute = require('./routes/userRoutes')
const postRoute = require('./routes/postRoutes')
const adminRoute = require('./routes/adminRoutes')
const chatRoute = require('./routes/chatRoutes')
const messageRoute = require('./routes/messageRoutes')

const port =  process.env.PORT || 5000

connectDB()

const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb'}))
app.use(express.urlencoded({ limit: '50mb',extended: false })) 

app.use('/',userRoute)
app.use('/post',postRoute)
app.use('/admin',adminRoute)
app.use('/chat',chatRoute)
app.use('/message',messageRoute)


app.use(errorHandler)

app.listen(port,()=> console.log(`Server connected to port ${port}`))