const express = require('express');
const passport = require('passport');

const Passport = require('../middlewares/passport');

const route = express.Router();

const AuthController = require('../controllers/authController');

route.post('/login', AuthController.login);
route.get('/check-auth', Passport.passportAuthenticate, AuthController.checkAuth);

route.post('/register', AuthController.register);

route.post('/reset-password', AuthController.resetPassword);
route.post('/reset-password/:resetToken', AuthController.createNewPassword);
route.get('/reset-password/:resetToken', AuthController.getPageCreatePassword);
route.get('/confirm-email/:confirmToken', AuthController.confirmAccount);

route.post('/change-password', Passport.passportAuthenticate, AuthController.changePassword);

route.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

route.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failed', session: false }), AuthController.loginGoogle);

route.get('/failed', AuthController.loginSocialFailed);

route.get('/logout', Passport.passportAuthenticate, AuthController.logout);
module.exports = route;
