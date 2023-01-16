const asyncHandler = require('express-async-handler')
const jwt = require('jsonwebtoken');

const adminProtect = asyncHandler(async(req,res)=>{
    let adminToken;
    if(req.headers){
        try{
            console.log(req.headers,'sdakjdajsdajkd1111111')
            adminToken = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(adminToken,process.env.JWT_SECRET);
            //user block check need to be worked
            req.admin = decoded.id
            next();
        }catch(e){
            res.status(401)
            throw new Error("User not Authorized");
        }
    }
    if(!adminToken){
        res.status(401)
        throw new Error("No Token Found");
    }
})


module.exports = adminProtect