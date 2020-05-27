const express = require('express');

const HotelController = require('../controllers/hotelController');
const RoomController = require('../controllers/roomController');
const ReviewController = require('../controllers/reviewController');
const SearchController = require('../controllers/searchController');

const Passport = require('../middlewares/passport');
const { checkPermission } = require('../middlewares/check-permission');

const upload = require('../middlewares/multer');

const route = express.Router();

route.get('/', HotelController.getAllHotels);

route.get('/partner', Passport.passportAuthenticate, checkPermission('hotel', 'readAll:own', ['partner']), HotelController.getAllHotelsOwnUser);

route.get('/top', HotelController.getTopHotels);

route.get('/:hotelId/near-by', HotelController.getNearByHotel);

route.get('/:hotelId', HotelController.getHotel);

route.post('/', Passport.passportAuthenticate, checkPermission('hotel', 'create:own', ['*']), upload.array('images'), HotelController.createHotel);

route.patch('/:hotelId', Passport.passportAuthenticate, checkPermission('hotel', 'update:own', ['*']), upload.array('images'), HotelController.updateHotel);

route.delete('/:hotelId', Passport.passportAuthenticate, checkPermission('hotel', 'delete:own', ['*']), HotelController.deleteHotel);

route.post('/search', SearchController.searchHotel);

route.post('/:hotelId/rooms/available', RoomController.getAllRoomsAvailable);

route.get('/:hotelId/rooms/:roomId', RoomController.getRoom);

route.post('/:hotelId/rooms', Passport.passportAuthenticate, checkPermission('room', 'create:own', ['*']), upload.array('images'), RoomController.createRoom);

route.patch('/:hotelId/rooms/:roomId', Passport.passportAuthenticate, checkPermission('room', 'update:own', ['*']), upload.array('images'), RoomController.updateRoom);

route.delete('/:hotelId/rooms/:roomId', Passport.passportAuthenticate, checkPermission('room', 'delete:own', ['*']), RoomController.deleteRoom);

route.get('/:hotelId/reviews', ReviewController.getAllReviewsOfHotel);

route.post('/:hotelId/reviews', Passport.passportAuthenticate, checkPermission('review', 'create:own', ['*']), ReviewController.createReviewHotel);

route.get('/:hotelId/favorite', Passport.passportAuthenticate, checkPermission('favorite', 'create:own', ['*']), HotelController.addToFavorite);

module.exports = route;
