const validator = require('validator');
const isEmpty = require('./is-empty');

const checkID = require('../helpers/checkIDExist');

exports.createLocation = (data) => {
  const errors = {};
  const value = {
    ...data,
    city: `${data.city}`,
  };

  value.name = !isEmpty(value.name) ? value.name : '';
  value.city = !isEmpty(value.city) ? value.city : '';

  if (validator.isEmpty(value.name)) {
    errors.name = 'Name field is required';
  }

  if (!validator.isMongoId(value.city) || !checkID(value.city, 'City')) {
    errors.city = 'City is invalid';
  }

  if (validator.isEmpty(value.city)) {
    errors.city = 'City field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};
