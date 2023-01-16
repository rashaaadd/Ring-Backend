const asyncHandler = require("express-async-handler");
const { cloudinary } = require("../utils/cloudinary");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");

//@desc Add new post
//@route POST /create
//@access Private
const newPost = asyncHandler(async (req, res) => {
  console.log("New post creation call reached at server.");
  let image;
  const { desc } = req.body;
  const userId = req.userId;
  // if (!desc || !image) {
  //   res.status(404);
  //   throw new Error("Upload data not found.");
  // }
  let user,post;
  try {
    if(req.file){
      image = req.file;
      const result = await cloudinary.uploader.upload(image?.path, {
        upload_preset: "ring-cloud",
      });
      user = await User.findById({ _id: userId });
      post = await Post.create({
        userId,
        userName: user.username,
        desc,
        images: result?.secure_url ? result.secure_url : null,
        cloudinary_id: result.public_id,
        time: new Date().toUTCString(),
      });
    }else{
      user = await User.findById({ _id: userId });
      post = await Post.create({
        userId,
        userName: user.username,
        desc,
        time: new Date().toUTCString(),
      });
    } 
    
    post = await Post.findById(post._id).populate("userId");
    console.log(post, "post created at server");
    user.posts.push(post._id);
    await user.save();
    res.status(200).json({
      status: "success",
      data: post,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    throw new Error("Error uploading file");
  }
});

//@desc Edit post
//@route PUT /:id
//@access Private

const updatePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.userId;
  const post = await Post.findById(postId);
  console.log(userId, ".....", post.userId);
  if (userId != post.userId) {
    res.status(403);
    throw new Error("Access Forbidden.");
  }
  let updatedPost = await post.updateOne({ $set: req.body });
  updatedPost = await Post.findById(postId).populate('userId');


  if (updatedPost) {
    res.status(200).json({
      status: "success",
      data: updatedPost,
      message: "Post Updated Successfully.",
    });
  } else {
    console.log(error);
    res.status(500);
    throw new Error("Error updating post");
  }
});

//@desc Delete post
//@route DELETE /:id
//@access Private

const deletePost = asyncHandler(async (req, res) => {
  console.log('Post deletion call @server');
  const postId = req.params.id;
  const userId = req.userId;
  const admin = req.query.admin;
  if (!admin && !userId) {
    res.status(401);
    throw new Error("Auth verification error");
  }
  if (!postId) {
    res.status(406);
    throw new Error("Post parameter not found");
  }
  const post = await Post.findById(postId);
  if (userId == post.userId || admin) {
    await cloudinary.uploader.destroy(post.cloudinary_id);
    await User.findByIdAndUpdate(userId, { $pull: { posts: postId } });
    await post.deleteOne();
    console.log('Post Deleted.........111');
    res.status(200).json({
      status: "success",
      message: "Post deleted successfully.",
    });
  } else {
    res.status(403);
    throw new Error("Access Forbidden.");
  }
});

//@desc Get user timeline
//@route GET /timeline
//access /private

const getTimelinePosts = asyncHandler(async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401);
    throw new Error("Authentication error.");
  }
  const userPosts = await Post.find({ userId }).populate("userId");
  if (!userPosts) {
    res.status(400);
    throw new Error("Failed to retrieve data.");
  }
  const followingPosts = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "posts",
        localField: "following",
        foreignField: "userId",
        as: "result",
      },
    },
    {
      $unwind: "$result",
    },
    {
      $project: {
        _id: "$result._id",
        userId: "$result.userId",
        desc: "$result.desc",
        images: "$result.images",
        cloudinary_id: "$result.cloudinary_id",
        likes: "$result.likes",
        comments: "$result.comments",
        reports: '$result.reports',
        createdAt: "$result.createdAt",
        updatedAt: "$result.updatedAt",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userId",
      },
    },
    {
      $unwind: "$userId",
    },
  ]);
  const data = userPosts
    .concat(followingPosts)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json({
    status: "success",
    message: "Timeline posts fetched.",
    data: data,
  });
  if (!data) {
    res.status(500);
    throw new Error("Server side error.");
  }
});

//@desc Get all Posts
//@route POST /post/allposts
//@access Private
const getAllPosts = asyncHandler(async (req, res) => {
  console.log("Get all posts call reached server.");
  try {
    const userId = req.userId;
    console.log(userId, "UserId at get all posts");
    const posts = await Post.find({})
      .limit(5)
      .sort({ createdAt: -1 })
      .populate("userId");
    console.log(posts, "all post retrieved");
    res.status(200).json({
      status: "success",
      data: posts,
      message: "All posts fetched successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(400);
    throw new Error("Error getting all posts.");
  }
});

//@desc Like/Unlike a post
//@route PUT /:id/like
//@access Private

const likePost = asyncHandler(async (req, res) => {
  console.log("like post call at server");
  const postId = req.params.id;
  const userId = req.userId;
  if (!postId) {
    res.status(402);
    throw new Error("Error getting parameters.");
  }

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found.");
  }

  if (post.likes.includes(userId)) {
    await post.updateOne({ $pull: { likes: userId } });
    res.status(200).json({
      status: "success",
      message: "Post Unliked",
    });
  } else {
    await post.updateOne({ $push: { likes: userId } });
    res.status(200).json({
      status: "success",
      message: "Post Liked",
    });
  }
});

//@desc Get profile posts
//@route GET /profile-posts/:id
//@access Private
const getProfilePosts = asyncHandler(async (req, res) => {
  console.log("GET PROFILE POSTS CALL REACHED SERVER");
  const userId = req.params.id;
  console.log(userId, "userId recieved at server");
  if (!userId) {
    res.status(402);
    throw new Error("Error getting parameters.");
  }
  const posts = await Post.find({ userId: userId }).populate("userId");
  if (!posts) {
    res.status(400);
    throw new Error("Error getting posts.");
  }
  res.status(200).json({
    status: "success",
    data: posts,
    message: "Profile Posts fetched successfully.",
  });
});

//@desc Add new comment
//@route POST /:id/comments
//@access Private
const addNewComment = asyncHandler(async (req, res) => {
  console.log("ADD NEW COMMENT CALL REACHED SERVER");
  const userId = req.userId;
  const postId = req.params.id;
  const { comment } = req.body;
  if (!userId || !postId) {
    res.status(400);
    throw new Error("Error getting parameters.");
  }

  if (!mongoose.Types.ObjectId.isValid(postId))
    throw new Error("No post with this id!");

  const { username, profilePic } = await User.findById(userId);
  const post = await Post.findByIdAndUpdate(
    postId,
    {
      $push: {
        comments: {
          commentedUserId: userId,
          commentedUserName: username,
          commentedUserPic: profilePic,
          comment: comment,
          time: new Date().toISOString(),
        },
      },
    },
    { new: true }
  );
  
  if(post){
    const comments = post.comments
    res.status(200).json({
      status: 'success',
      message: 'Commented successfully',
      data: comments[comments.length - 1]
  })
  }else{
    res.status(500)
    throw new Error("Error adding comment.")
  }
});


//@desc Get post comments
//@route GET /:id/comments
//@access /private

const getPostComments = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.userId
  if (!postId ||!userId) {
    res.status(400);
    throw new Error('Parameters not found')
  }
  const post = await Post.findById({_id: postId})
  if(!post){
    res.status(404);
    throw new Error('Post not found')
  }
  const comments = post.comments
  res.status(200).json({
    status: "success",
    data: comments,
    message: "Post Comments fetched successfully.",
  })
})


//@desc Get saved posts
//@route GET /:id/saved-posts
//@access /private
const getSavedPosts = asyncHandler(async(req,res) => {
  console.log("GET USER SAVED POSTS")
  const userId = req.params.id
  console.log(userId);
  
  if (!userId) {
    res.status(400);
    throw new Error("Error getting params.")
  }
  const savedPosts = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "posts",
        localField: "savedPost",
        foreignField: "_id",
        as: "result",
      },
    },
    {
      $unwind: "$result",
    },
    {
      $project: {
        _id: "$result._id",
        userId: "$result.userId",
        desc: "$result.desc",
        images: "$result.images",
        cloudinary_id: "$result.cloudinary_id",
        likes: "$result.likes",
        comments: "$result.comments",
        reports: '$result.reports',
        createdAt: "$result.createdAt",
        updatedAt: "$result.updatedAt"
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userId",
      },
    },
    {
      $unwind: "$userId",
    },
  ]);
  console.log(savedPosts)
  if(!savedPosts){
    res.status(400);
    throw new Error("Error getting saved posts.")
  }
  res.status(200).json({
    status: "success",
    data: savedPosts,
    message: "Saved posts fetched successfully.",
  })
})


//@desc Report a post
//@route PUT /:id/report
//@access /private
const reportPost = asyncHandler(async(req,res) => {
  const postId = req.params.id
  const userId = req.userId
  if(!userId || !postId){
    res.status(400)
    throw new Error("Error getting parameters.")
  }
  const post = await Post.findById(postId)
  if(!post){
    res.status(404)
    throw new Error("Post not found")
  }
  if(post.reports.includes(userId)){
    res.status(200).json({
      message:'You have already reported this post.'
    })
  }else{
    await post.updateOne({ $push: { reports: userId } });
    res.status(200).json({
      status: "success",
      message: "Post reported.",
    });
  }

})
 
module.exports = {
  newPost,
  getAllPosts,
  updatePost,
  deletePost,
  getTimelinePosts,
  likePost,
  getProfilePosts,
  getPostComments,
  addNewComment,
  getSavedPosts,
  reportPost
};
