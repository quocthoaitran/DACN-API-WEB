const validator = require('validator');
const isEmpty = require('./is-empty');

const createCity = (data) => {
  const errors = {};
  const value = {
    ...data,
    zipcode: `${data.zipcode}`,
  };

  value.name = !isEmpty(value.name) ? value.name : '';
  value.zipcode = !isEmpty(value.zipcode) ? value.zipcode : '';
  value.country = !isEmpty(value.country) ? value.country : '';

  if (validator.isEmpty(value.name)) {
    errors.name = 'Name field is required';
  }

  if (!validator.isNumeric(value.zipcode)) {
    errors.zipcode = 'Zipcode must be numberic';
  }

  if (validator.isEmpty(value.zipcode)) {
    errors.zipcode = 'Zipcode field is required';
  }

  if (validator.isEmpty(value.country)) {
    errors.country = 'Country field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

const updateCity = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  if (value.name === '') {
    errors.name = 'Name field is required';
  }

  if (value.zipcode && typeof value.zipcode !== 'number') {
    errors.country = 'Zipcode must be numberic';
  }

  if (value.country === '') {
    errors.country = 'Country field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

module.exports = {
  createCity,
  updateCity,
};
