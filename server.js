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

const port = process.env.PORT || 5000

connectDB()

const app = express()

const { Server } = require('socket.io');

const io = new Server(8800, {
    cors: {
        origin: ["http://localhost:3000","https://master.d3mn9a96s3gfxu.amplifyapp.com", "https://www.master.d3mn9a96s3gfxu.amplifyapp.com"]
    },
});

let activeUsers = [];

io.on("connection", (socket) => {
    // Add new User
    socket.on("new-user-add", (newUserId) => {
        //if user not added previously
        if (!activeUsers.some((user) => user.userId === newUserId)) {
            activeUsers.push({
                userId: newUserId,
                socketId: socket.id,
            });
        }
        console.log("Connected users", activeUsers);
        io.emit("get-users", activeUsers);
    });

    socket.on("disconnect", () => {
        activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
        console.log("User Disconnected", activeUsers);
        io.emit("get-users", activeUsers);
    });
    //send message
    socket.on("send-message", (data) => {
        const { recieverId } = data;
        const user = activeUsers.find((user) => user.userId === recieverId);
        console.log("Sending from socket to :", recieverId);
        console.log(user, "Data", data);
        if (user) {
            console.log(data, "hshahdjajklsdkj");
            io.to(user?.socketId).emit("recieve-message", data);
        }
    });
});

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: false }))

app.use('/', userRoute)
app.use('/post', postRoute)
app.use('/admin', adminRoute)
app.use('/chat', chatRoute)
app.use('/message', messageRoute)


app.use(errorHandler)

app.listen(port, () => console.log(`Server connected to port ${port}`))