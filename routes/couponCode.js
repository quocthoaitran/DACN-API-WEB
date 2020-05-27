const express = require('express');

const CouponController = require('../controllers/couponCodeController');
const Passport = require('../middlewares/passport');
const { checkPermission } = require('../middlewares/check-permission');

const route = express.Router();

route.get('/', Passport.passportAuthenticate, checkPermission('couponcode', 'read:any', ['*']), CouponController.getAllCouponCodes);

route.get('/partner', Passport.passportAuthenticate, checkPermission('couponcode', 'read:own', ['*']), CouponController.getAllCouponCodesOwnUser);

route.post('/', Passport.passportAuthenticate, checkPermission('couponcode', 'create:own', ['*']), CouponController.createCouponCode);

route.post('/:code', Passport.passportAuthenticate, checkPermission('couponcode', 'update:any', ['*']), CouponController.checkCouponCode);

route.patch('/:code', Passport.passportAuthenticate, checkPermission('couponcode', 'update:own', ['*']), CouponController.finishCouponCode);

module.exports = route;
