const validator = require('validator');
const isEmpty = require('./is-empty');

const updateProfile = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  if (value.firstname === '') {
    errors.firstname = 'First name field is required';
  }

  if (value.lastname === '') {
    errors.lastname = 'Last name field is required';
  }

  if (value.email_paypal && typeof value.email_paypal === 'string' && !validator.isEmail(value.email_paypal)) {
    errors.email_paypal = 'Email paypal is invalid';
  }

  if (value.email_paypal && typeof value.email_paypal !== 'string') {
    errors.email_paypal = 'Email paypal is invalid';
  }

  if (value.email_paypal === '') {
    errors.email_paypal = 'Email paypal field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

module.exports = {
  updateProfile,
};
