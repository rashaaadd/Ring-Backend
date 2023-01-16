const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");

//default path  ---- /message

//@desc Create Message
//@route POST /
//@access private
const addMessage = asyncHandler(async (req, res) => {
  const { chatId, senderId, message } = req.body;
  if (!chatId || !senderId || !message) {
    res.status(400);
    throw new Error("Error recieving data.");
  }
  const newMessage = await Message.create({
    chatId,
    senderId,
    message,
  });
  if (!newMessage) {
    res.status(400);
    throw new Error("Error creating new message.");
  }
  res.status(200).json({
    status: "success",
    data: newMessage,
    message: "New message created.",
  });
});


//@desc Create Message
//@route GET /:chatId
//@access private
const getMessages = asyncHandler(async (req, res) => {
  const chatId = req.params.chatId;
  if (!chatId) {
    res.status(400);
    throw new Error("Error recieving data.");
  }
  const message = await Message.find({
    chatId,
  });
  console.log(message,'messaggeeee')
  if(!message) {
    res.status(400);
    throw new Error("Message not found.");
  }
  res.status(200).json({
    status: "success",
    data:message,
    message:'Message received'
  });
});

module.exports = {
  addMessage,
  getMessages,
};
