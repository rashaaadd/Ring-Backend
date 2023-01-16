const express = require('express');
const router = express.Router();
const adminProtect = require('../middleware/adminAuthMiddleware')
const {
    adminLogin, 
    getAllUsers,
    changeUserStatus,
    getReportedPosts
} = require('../controllers/adminController')

router.post('/login',adminLogin)

router.get('/getusers',getAllUsers)

router.put('/:id',changeUserStatus)

router.get('/reported-posts',getReportedPosts)


module.exports = router;