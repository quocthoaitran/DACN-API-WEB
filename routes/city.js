const express = require('express');

const CityController = require('../controllers/cityController');

const Passport = require('../middlewares/passport');
const { checkPermission } = require('../middlewares/check-permission');

const upload = require('../middlewares/multer');

const route = express.Router();

route.get('/', Passport.passportAuthenticate, checkPermission('city', 'read:any', ['*']), CityController.getAllCities);
route.get('/airports', CityController.getAllAirports);
route.get('/top', CityController.getTopDestinates);
route.post('/', Passport.passportAuthenticate, checkPermission('city', 'create:any', ['*']), upload.single('image'), CityController.createCity);
route.patch('/:cityId', Passport.passportAuthenticate, checkPermission('city', 'update:any', ['*']), upload.single('image'), CityController.updateCity);
route.delete('/:cityId', Passport.passportAuthenticate, checkPermission('city', 'delete:any', ['*']), CityController.deleteCity);

module.exports = route;
