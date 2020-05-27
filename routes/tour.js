const express = require('express');

const TourController = require('../controllers/tourController');
const ReviewController = require('../controllers/reviewController');
const SearchController = require('../controllers/searchController');
const Passport = require('../middlewares/passport');
const { checkPermission } = require('../middlewares/check-permission');

const upload = require('../middlewares/multer');

const route = express.Router();

route.get('/', TourController.getAllTours);

route.get('/partner', Passport.passportAuthenticate, checkPermission('tour', 'readAll:own', ['partner']), TourController.getAllToursOwnUser);

route.get('/top', TourController.getTopTours);

route.get('/:tourId/similar', TourController.getSimilarTours);

route.get('/:tourId', TourController.getTour);

route.post('/', Passport.passportAuthenticate, checkPermission('tour', 'create:own', ['*']), upload.array('images'), TourController.createTour);

route.patch('/:tourId', Passport.passportAuthenticate, checkPermission('tour', 'update:own', ['*']), upload.array('images'), TourController.updateTour);

route.delete('/:tourId', Passport.passportAuthenticate, checkPermission('tour', 'delete:own', ['*']), TourController.deleteTour);

route.post('/search', SearchController.searchTour);

route.get('/:tourId/reviews', ReviewController.getAllReviewsOfTour);

route.post('/:tourId/reviews', Passport.passportAuthenticate, checkPermission('review', 'create:own', ['*']), ReviewController.createReviewTour);

route.get('/:tourId/favorite', Passport.passportAuthenticate, checkPermission('favorite', 'create:own', ['*']), TourController.addToFavorite);

module.exports = route;
