const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().getTime()}_${req.user.profile}_${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Error mime type of file'), false);
  }
};

const upload = multer({
  storage,
  limits: 1024 * 1024 * 5,
  fileFilter,
});

module.exports = upload;
