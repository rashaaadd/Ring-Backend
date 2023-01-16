const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    fname: {
      type: String,
      required: [true, "Please enter first name"],
    },
    lname: {
      type: String,
      required: [true, "Please enter last name"],
    },
    email: {
      type: String,
      required: [true, "Please enter email"],
    },
    username: {
      type: String,
      required: [true, "Please enter username"],
      unique: [
        true,
        "Username already exist. Please enter a different username",
      ],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    profilePic: {
      type: String,
    },
    coverPic: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
      unique: [
        true,
        "Phone already exist. Please enter a different phone number",
      ],
    },
    following: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: null,
    },
    followers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: null,
    },
    details: {
      dob: {
        type: Date,
      },
      relation: {
        type: String,
      },
      gender: {
        type: String,
      },
      bio: String,
      work: String,
      city: String,
      country: String,
    },
    posts: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Post",
    },
    profile_cloudinary_id: {
      type: String
    },
    cover_cloudinary_id:{
      type: String
    },
    isBlocked:{
      type:Boolean,
      default:false,
    },
    savedPost:{
      type:[mongoose.Schema.Types.ObjectId],
      ref:"Post",
      default:null
    }
  },
  {
    timestamp: true,
  }
);

module.exports = mongoose.model("User", userSchema);
