const express = require('express');

const UserController = require('../controllers/userController');

const Passport = require('../middlewares/passport');
const { checkPermission } = require('../middlewares/check-permission');

const multer = require('../middlewares/multer');

const route = express.Router();

route.get('/', Passport.passportAuthenticate, checkPermission('user', 'read:any', ['*']), UserController.getAllProfiles);
route.get('/:userId', UserController.getProfile);
route.patch('/', Passport.passportAuthenticate, checkPermission('user', 'update:own', ['*']), multer.single('avatar'), UserController.updateProfile);

module.exports = route;
