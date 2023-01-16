const express = require('express');
const upload = require('../utils/multer');

const router = express.Router()
const {
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
} = require('../controllers/userControllers');


const protect = require('../middleware/authMiddleware')

router.post('/register',registerUser);

router.post('/get-otp',getOTP);

router.post('/reset-password/:id',resetPassword);

router.post('/verify-otp',verifyOTP)

router.post("/login",loginUser)

router.get('/user',protect,getUser)

router.get('/user/:id',protect,getUserDetails)


router.post('/:id/user',protect,upload.fields([{
    name:'profile',
    maxCount:1  
},{
    name:'cover',
    maxCount:1
}]),updateUser)

// router.route('/:id',protect).delete(deleteUser);

router.get('/allusers',protect,getAllUsers)

router.route('/:id/follow').put(protect,followUser)

router.get('/:id/following-users',protect,getFollowingUsers)

router.get('/:id/follower-users',protect,getFollowersUsers)

router.put('/:id/save',protect,savePost)

router.post('/:id/verify-user',protect,verifyUser)








module.exports = router;