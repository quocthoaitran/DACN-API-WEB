const express = require('express');

const LocationController = require('../controllers/locationController');

const Passport = require('../middlewares/passport');
const { checkPermission } = require('../middlewares/check-permission');

const upload = require('../middlewares/multer');

const route = express.Router();

route.get('/', Passport.passportAuthenticate, checkPermission('location', 'read:any', ['*']), LocationController.getAllLocations);
route.post('/', Passport.passportAuthenticate, checkPermission('location', 'create:own', ['*']), upload.single('image'), LocationController.createLocation);
route.patch('/:locationId', Passport.passportAuthenticate, checkPermission('location', 'update:own', ['*']), upload.single('image'), LocationController.updateLocation);
route.delete('/:locationId', Passport.passportAuthenticate, checkPermission('location', 'delete:own', ['*']), LocationController.deleteLocation);

module.exports = route;
