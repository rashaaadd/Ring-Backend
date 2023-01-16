const multer = require("multer");
const path = require("path");

module.exports = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    // let ext = path.extname(file.originalname);
    // if(ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png' && ext !== '.webp' && ext.toLowerCase() !== '.gif', ext !== '.mkv' && ext !== '.mp4'){
    //     cb(new Error('Unsupported file type!'));
    //     return;
    // }
    // cb(null);
    if (file.mimetype === "image/gif" || file.mimetype.startsWith("image/" || file.mimetype.startsWith('video/'))) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type!"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 20 MB
  }
});
// const fileFilter = (req, file, cb) => {
//   // Allow .gif and image files
//   if (file.mimetype === "image" || file.mimetype.startsWith("image")) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };
