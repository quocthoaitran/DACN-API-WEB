const express = require('express');

const FavoriteController = require('../controllers/favoriteController');

const Passport = require('../middlewares/passport');
const { checkPermission } = require('../middlewares/check-permission');

const route = express.Router();

route.get('/', Passport.passportAuthenticate, checkPermission('favorite', 'readAll:own', ['member']), FavoriteController.getAllFavorites);

module.exports = route;
