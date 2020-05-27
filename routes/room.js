const express = require('express');

const ReviewController = require('../controllers/reviewController');

const Passport = require('../middlewares/passport');
const { checkPermission } = require('../middlewares/check-permission');

const route = express.Router();

route.post('/:roomId/reviews', Passport.passportAuthenticate, checkPermission('review', 'create:own', ['*']), ReviewController.createReviewRoom);

module.exports = route;
