const express = require('express');

const DiscountController = require('../controllers/discountController');
const Passport = require('../middlewares/passport');
const { checkPermission } = require('../middlewares/check-permission');

const route = express.Router();

route.get('/', Passport.passportAuthenticate, checkPermission('discount', 'read:any', ['*']), DiscountController.getAllDiscounts);

route.get('/partner', Passport.passportAuthenticate, checkPermission('discount', 'read:own', ['*']), DiscountController.getAllDiscountsOwnUser);

route.get('/:discountId', checkPermission('discount', 'read:own', ['*']), DiscountController.getDiscount);

route.post('/', Passport.passportAuthenticate, checkPermission('discount', 'create:own', ['*']), DiscountController.createDiscount);

route.delete('/:discountId', Passport.passportAuthenticate, checkPermission('discount', 'delete:own', ['*']), DiscountController.deleteDiscount);

module.exports = route;
