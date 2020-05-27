const express = require('express');

const FlightController = require('../controllers/flightController');
const SearchController = require('../controllers/searchController');

const Passport = require('../middlewares/passport');
const { checkPermission } = require('../middlewares/check-permission');

const route = express.Router();

route.get('/', Passport.passportAuthenticate, checkPermission('flight', 'read:any', ['*']), FlightController.getAllFlights);
route.post('/search', SearchController.searchFlight);

module.exports = route;
