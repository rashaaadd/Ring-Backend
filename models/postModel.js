const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    desc:{
        type: String,
    },
    images:{
        type: String,
        required: [true, 'No image'],
    },      
    cloudinary_id: {
        type: String,
        required: true
    },
    likes:{
        type:[mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: []
    },
    reports:{
        type:[mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: []
    },
    comments:[{
        commentedUserId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        commentedUserName:{
            type: String,
            required: true
        },
        commentedUserPic:{
            type: String,
            required: true
        },
        comment:{
            type: String,
            required: true
        },
        time:{
            type: Date,
            required: true,
        }
    }],
},{
    timestamps:true
});

module.exports = mongoose.model('Post',postSchema);