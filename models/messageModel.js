const mongoose = require('mongoose')

const messageSchema = mongoose.Schema(
    {
        chatId:{
            type: String,
        },
        senderId:{
            type: String,
        },
        message:{
            type: String, 
        }
    },
    {
        timestamps:true
    }
)

module.exports = mongoose.model('Message',messageSchema)