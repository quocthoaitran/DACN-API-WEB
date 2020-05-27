const express = require('express');

const BookingController = require('../controllers/bookingController');

const Passport = require('../middlewares/passport');
const { checkPermission } = require('../middlewares/check-permission');

const route = express.Router();

route.get('/', Passport.passportAuthenticate, Passport.passportAuthenticate, checkPermission('booking', 'read:any', ['*']), BookingController.getAllBookings);
route.get('/partner', Passport.passportAuthenticate, checkPermission('booking', 'readAll:own', ['partner']), BookingController.getAllBookingsOwnPartner);
route.get('/member', Passport.passportAuthenticate, checkPermission('booking', 'readAll:own', ['member']), BookingController.getAllBookingsOwnMember);
route.post('/', Passport.passportAuthenticate, checkPermission('booking', 'create:own', ['*']), BookingController.bookItem);
route.get('/success', BookingController.bookSuccess);
route.get('/cancel', BookingController.bookCancel);

module.exports = route;
