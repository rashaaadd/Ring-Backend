const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded) {
        res.status(401)
        localStorage.clear();
        throw new Error("Your account is blocked.")


      }
      //user block check need to be worked
      const user = await User.findById(decoded.id);
      if (!user) {
        res.status(401);
        throw new Error("User not Found");
      }
      if (user.isBlocked) {
        res.status(401);
        localStorage.clear();
         throw new Error("Your account is blocked.")
      }
      req.userId = decoded.id;
      next();
    } catch (e) {
      res.status(401);
      console.log(e)
      throw new Error("User not Authorized");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("No Token Found");
  }
});

module.exports = protect;
