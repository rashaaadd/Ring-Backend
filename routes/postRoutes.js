const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const { 
    newPost,
    getAllPosts ,
    updatePost,
    deletePost,
    getTimelinePosts,
    likePost,
    getProfilePosts,
    getPostComments,
    addNewComment,
    getSavedPosts,
    reportPost
} = require('../controllers/postController');

const protect = require('../middleware/authMiddleware');

router.post('/create',protect,upload.single('image'),newPost)

router.route('/:id').put(protect,updatePost).delete(deletePost)

router.get('/allposts',protect,getAllPosts)

router.get('/profile-posts/:id',protect,getProfilePosts)

router.get('/timeline',protect,getTimelinePosts)

router.put('/:id/like',protect,likePost)

router.put('/:id/report',protect,reportPost)

router.route('/:id/comments').get(protect,getPostComments).post(protect,addNewComment)

router.get('/:id/saved-posts',protect,getSavedPosts)





module.exports = router;