const express = require('express');

const ReviewController = require('../controllers/reviewController');

const Passport = require('../middlewares/passport');
const { checkPermission } = require('../middlewares/check-permission');

const route = express.Router();

route.get('/', Passport.passportAuthenticate, checkPermission('review', 'read:any', ['*']), ReviewController.getAllReviews);
route.get('/member', Passport.passportAuthenticate, checkPermission('review', 'readAll:own', ['member']), ReviewController.getAllReviewsOwnMember);
route.get('/partner', Passport.passportAuthenticate, checkPermission('review', 'readAll:own', ['partner']), ReviewController.getAllReviewsOwnPartner);

module.exports = route;
