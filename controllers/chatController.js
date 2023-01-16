const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");

//default path -------- /chat

//@desc Create Chat
//@route POST /
//@access private

const createChat = asyncHandler(async (req, res) => {
  console.log(req.body, "req body at chat controller");
  const { senderId, recieverId } = req.body
  const chat = await Chat.find(
    {
        memebers:{
            $all:[senderId,recieverId]
        }
    }
  )
  console.log(chat,'sduhasdasudib')
  if(chat.length > 0){
    res.status(400)
    throw new Error("Chat already created.")
  }
  const newChat = await Chat.create({
    members: [ senderId, recieverId ],
  }); 
  if(!newChat){
    res.status(400)
    throw new Error("Error creating chat.")
  }
  res.status(200).json({
    status: 'success',
    data: newChat,
    message: 'Chat created successfully.'
  })
});

//@desc Create Chat
//@route POST /
//@access private

const userChats = asyncHandler(async (req, res) => {
  console.log(req.body, "req body at chat controller");
    const userId = req.params.userId
    const chat = await Chat.find(
        {
            members: {
                $in:[userId]
            }
        }
    )
    if(!chat){
        res.status(403)
        throw new Error("User Chat not found.")
    }
    res.status(200).json({
        status:'success',
        data: chat,
        message: 'User chat retrieved successfully.'
    })
});

//@desc Create Chat
//@route POST /
//@access private

const findChat = asyncHandler(async (req, res) => {
  console.log(req.body, "req body at chat controller");
  const senderId = req.params.firstId
  const recieverId = req.params.secondId
  if(!senderId || !recieverId){
    res.status(400)
    throw new Error("User params not Found.")
  }
  const chat = await Chat.find(
    {
        memebers:{
            $all:[senderId,recieverId]
        }
    }
  )
  if(!chat){
    res.status(403)
    throw new Error("User Chat not found.")
  }
  res.status(200).json({
    status:'success',
    data: chat,
    message: 'User chat found successfully.'
  })
});

module.exports = {
  createChat,
  userChats,
  findChat,
};
