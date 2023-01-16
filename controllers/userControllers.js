const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cloudinary } = require("../utils/cloudinary");
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SERVICE_ID, JWT_SECRET } =
  process.env;
const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "1d",
  });
};

//@desc Register new user
//@route POST /register
//access /public
const registerUser = asyncHandler(async (req, res) => {
  console.log("User registration call reached server");
  const { fname, lname, phone, email, username, password } = req.body;
  //Validation
  if (!email || !username || !password || !fname || !lname || !phone) {
    res.status(400);
    throw new Error("Please add all fields.");
  }
  const [emailExists, usernameExists, phoneExists] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ username }),
    User.findOne({ phone }),
  ]);

  if (emailExists) {
    res.status(400);
    throw new Error("Email already exists.");
  }
  if (usernameExists) {
    res.status(400);
    throw new Error("Username already exists.");
  }
  if (phoneExists) {
    res.status(400);
    throw new Error("Phone already exists.");
  }

  //Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  //Create User
  const newUser = await User.create({
    fname,
    lname,
    password: hashedPassword,
    email,
    username,
    phone,
  });
  if (newUser) {
    res.status(200).json({
      status: "success",
      data: {
        _id: newUser._id,
        fname,
        lname,
        email,
        phone,
      },
      message: "User created successfully",
    });
  } else {
    res.status(400);
    throw new Error("User creation failed.");
  }
});

//@desc Get phone for Twilio
//@route POST /get-otp
//access /public
const getOTP = asyncHandler(async (req, res) => {
  console.log("GET OTP CALL AT SERVER");
  const { phone } = req.body;
  if (!phone) {
    res.status(400);
    throw new Error("Please add all fields.");
  }
  const user = await User.findOne({ phone });
  if (!user) {
    res.status(400);
    throw new Error("Phone number not registered.");
  }
  const otpResponse = await client.verify
    .services(TWILIO_SERVICE_ID)
    .verifications.create({
      to: `+91${phone}`,
      channel: "sms",
    });

  res.status(200).json({
    status: "success",
    message: "An OTP has beeen sent to your phone number.",
    data:user
  });
});

//@desc Verify OTP
//@route POST /verify-user
//access /public

const verifyOTP = asyncHandler(async (req, res) => {
  console.log("VERIFY OTP CALL AT SERVER");
  const { otp1, otp2, otp3, otp4, otp5, otp6, userData } = req.body;
  const otp = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;
  if (!otp || otp.length !== 6) {
    res.status(400);
    throw new Error("Please add all fields.");
  }
  const verifiedRes = await client.verify
    .services(TWILIO_SERVICE_ID)
    .verificationChecks.create({
      to: `+91${userData?.phone}`,
      code: otp,
    });

  if (!verifiedRes.valid) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  res.status(200).json({
    status: "success",
    message: "OTP verified successfully",
    data: userData._id,
  });
});

//@desc Change password
//@route POST /reset-password/:id
//access public

const resetPassword = asyncHandler(async (req, res) => {
  console.log("RESET PASSWORD CALL AT SERVER");
  const userId = req.params.id;
  const { password } = req.body;
  console.log(userId, "............", password);
  if (!userId || !password) {
    res.status(400);
    throw new Error("Please add all fields.");
  }
  const user = await User.findById(userId);
  console.log(user, "userrrrrrr11");
  if (!user) {
    res.status(400);
    throw new Error("User not found.");
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const updatedUser = await User.findByIdAndUpdate(userId, {
    $set: { password: hashedPassword },
  });
  console.log("user password updated");
  if (!updateUser) {
    res.status(400);
    throw new Error("Error updating user.");
  }
  res.status(200).json({
    status: "success",
    message: "Password changed successfully",
  });
});

//@desc Authenticate User
//@route POST /login
//access /public
const loginUser = asyncHandler(async (req, res) => {
  console.log("User login call reached server");
  const { email, password } = req.body;

  //Validation
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add all fields.");
  }

  const user = await User.findOne({ email }).select("+password");
  
  if (user && (await bcrypt.compare(password, user.password))) {
    if(user.isBlocked){
      res.status(403)
      throw new Error("Account Blocked.")
    }
    res.status(200).json({
      status: "success",
      data: {
        _id: user._id,
        fname: user.fname,
        lname: user.lname,
        token: generateToken(user._id),
      },
      message: "User Login Successfull",
    });
  } else {
    res.status(400);
    throw new Error("Invalid Credentials.");
  }
});

//@desc Get user details
//@route GET /user
//access /private
const getUser = asyncHandler(async (req, res) => {
  console.log("GET USER CALL AT SERVER");
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      res.status(201).json({
        status: "success",
        data: {
          user,
        },
        message: "Authorisation successfull",
      });
    }
  } catch (e) {
    console.log(e, "error getting user data");
    res.status(501);
    throw new Error("Error getting user data");
  }
});

//@desc Update user
//@route PUT /:id
//access /private

const updateUser = asyncHandler(async (req, res) => { 
  console.log("UPDATE USER AT SERVER");
  console.log(req.files, "adadsadsa");
  const userId = req.params.id;
  if (!userId || req.body === {}) {
    res.status(400);
    throw new Error("Invalid data");
  }
  if (userId !== req.userId) {
    res.status(500);
    throw new Error("Access denied.");
  }
  if (req.files.profile || req.files.cover) {
    console.log("hello");
    const profilePic = req.files.profile[0];
    const coverPic = req.files.cover[0];
    console.log(profilePic, "......", coverPic);
    if (profilePic) {
      const profileResult = await cloudinary.uploader.upload(profilePic?.path, {
        upload_preset: "ring-cloud",
      });
      req.body.profile_cloudinary_id = profileResult.public_id;
      req.body.profilePic = profileResult?.secure_url;
    }
    if (coverPic) {
      const coverResult = await cloudinary.uploader.upload(coverPic?.path, {
        upload_preset: "ring-cloud",
      });
      req.body.cover_cloudinary_id = coverResult.public_id;
      req.body.coverPic = coverResult?.secure_url;
    }
  }
  if (!req.body.details) {
    const details = {};
    details.dob = req.body.dob ? req.body.dob : null;
    details.relation = req.body.relation ? req.body.relation : null;
    details.bio = req.body.bio ? req.body.bio : null;
    details.work = req.body.work ? req.body.work : null;
    details.gender = req.body.gender ? req.body.gender : null;
    details.city = req.body.city ? req.body.city : null;
    details.country = req.body.country ? req.body.country : null;
    req.body.details = details;
  }
  console.log("brrrr");
  const user = await User.findByIdAndUpdate({ _id: userId }, req.body, {
    new: true,
  });
  console.log(user, "dsashahsdk");
  if (user) {
    res.status(201).json({
      status: "success",
      data: user,
      message: "User updated successfully",
    });
  } else {
    console.log(error);
    res.status(502);
    throw new Error("Error updating user.");
  }
});

//@desc Delete user
//@route DELETE /user
//access /private
const deleteUser = asyncHandler(async (req, res) => {
  console.log("DELETE USER AT SERVER");
  const userId = req.params.id;

  // if(userId === req.user._id){
  try {
    const user = await User.findByIdAndRemove(userId);
    if (user) {
      res.status(200).json({
        status: "success",
        message: "User deleted successfully",
      });
    } else {
      res.status(404);
      throw new Error("User not found.");
    }
  } catch (error) {
    console.log(error);
    res.status(500);
    throw new Error("Error deleting user");
  }
  // }else{
  //   res.status(500)
  //     throw new Error("Access denied")
  // }
});

//@desc Verify user
//@route POST /:id/varify-user
//access /private
const verifyUser = asyncHandler(async(req,res) => {
  console.log("VERIFY USER AT SERVER");
  const userId = req.params.id;
  console.log(userId)
  const { password } = req.body
  console.log(password)
  if(!userId || !password){
    res.status(400);  
    throw new Error("Insufficient data for the request.");
  }
  const user = await User.findById(userId).select('+password');
  if(!user){
    res.status(404);  
    throw new Error("User not found.");
  }
  if(user && (await bcrypt.compare(password,user.password))){
    res.status(200).json({
      status: "success",
      message:'User verified.'
    });
  }else{
    res.status(200).json({
      message:'Incorrect password.'
    })
  }
})

//@desc Follow a user
//@route PUT /follow/:id
//access /private
const followUser = asyncHandler(async (req, res) => {
  console.log("FOLLOW/UNFOLLOW USER AT SERVER");
  const followUserId = req.params.id;
  const userId = req.userId;
  if (userId === followUserId) {
    res.status(403);
    throw new Error("Action forbidden");
  } else {
    try {
      const followUser = await User.findById(followUserId);
      const user = await User.findById(userId);

      if (!followUser.followers.includes(userId)) {
        await followUser.updateOne({ $push: { followers: userId } });
        await user.updateOne({ $push: { following: followUserId } });
        res.status(200).json({
          status: "success",
          message: "User followed successfully.",
        });
      } else {
        await followUser.updateOne({ $pull: { followers: userId } });
        await user.updateOne({ $pull: { following: followUserId } });
        res.status(200).json({
          status: "success",
          message: "User unfollowed successfully.",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500);
      throw new Error("Error following user");
    }
  }
});

//@desc Get all users
//@route GET /allusers
//access /public

const getAllUsers = asyncHandler(async (req, res) => {
  console.log("GET ALL USER AT SERVER");
  const userId = req.userId;
  try {
    const users = await User.find({ _id: { $ne: userId } });
    res.status(200).json({
      status: "success",
      message: "Users found",
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    throw new Error("Error getting all users");
  }
});

//@desc Get following users
//@route GET /:id/following-users
//access /public
const getFollowingUsers = asyncHandler(async (req, res) => {
  console.log("GET FOLLOWING USERS AT SERVER");
  const userId = req.params.id;
  console.log(userId, "userId");
  if (!userId) {
    res.status(400);
    throw new Error("Missing Parameters");
  }
  const user = await User.findById(userId).populate("following");
  if (!user) {
    res.status(400);
    throw new Error("No user found.");
  }
  const followingUsers = user?.following;
  console.log(followingUsers, "sdadsadasd");
  res.status(200).json({
    status: "success",
    data: followingUsers,
    message: "Users found",
  });
});

//@desc Get follower users
//@route GET /:id/follower-users
//access /public
const getFollowersUsers = asyncHandler(async (req, res) => {
  console.log("GET FOLLOWER USERS AT SERVER");
  const userId = req.params.id;
  console.log(userId, "userId");
  if (!userId) {
    res.status(400);
    throw new Error("Missing Parameters");
  }
  const user = await User.findById(userId).populate("followers");
  if (!user) {
    res.status(400);
    throw new Error("No user found.");
  }
  const followerUsers = user?.followers;
  console.log(followerUsers, "sdadsadasd");
  res.status(200).json({
    status: "success",
    data: followerUsers,
    message: "Users found",
  });
});


//@desc GET user details
//@route GET /user/:id
//access /private
const getUserDetails = asyncHandler(async(req,res) => {
  const userId = req.params.id
  if(!userId){
    res.status(400)
    throw new Error('Parameters not found.')
  }
  const userDetails = await User.findById(userId)
  if(!userDetails){
    res.status(400)
  }
  res.status(200).json({
    status:'success',
    message:'User data fetched successfully.',
    data: userDetails
  })
})


//@desc Save post
//@route PUT /:id/save
//access /private
const savePost = asyncHandler(async(req,res)=>{
  console.log('SAVE POST CALL AT SERVER')
  const postId = req.params.id;
  if(!postId){
    res.status(400)
    throw new Error("Error getting params.")
  }
  console.log(req.userId,'dsasjdnasdja')
  const user = await User.findById(req.userId)
  console.log(user,'sdhajdahs')
  if(!user){
    res.status(400)
    throw new Error("Error getting user details.")
  }
  if(!user.savedPost.includes(postId)){
    user.savedPost.push(postId)
  }else{
    user.savedPost.pull(postId)
  }
  await user.save()
  res.status(200).json({
    status:'success',
    message:'Post saved successfully.',
    data: user.savedPost
  })
})



module.exports = {
  registerUser,
  loginUser,
  getUser,
  updateUser,
  deleteUser,
  followUser,
  getAllUsers,
  getOTP,
  verifyOTP,
  resetPassword,
  getFollowingUsers,
  getFollowersUsers,
  getUserDetails,
  savePost,
  verifyUser
};
