const validator = require('validator');
const isEmpty = require('./is-empty');

const createReview = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  value.title = !isEmpty(value.title) ? value.title : '';
  value.content = !isEmpty(value.content) ? value.content : '';

  if (validator.isEmpty(value.title)) {
    errors.title = 'Title field is required';
  }

  if (validator.isEmpty(value.content)) {
    errors.content = 'Content field is required';
  }

  if (typeof value.rate_star === 'number' && (value.rate_star < 1 || value.rate_star > 5)) {
    errors.rate_star = 'Rate star must be greater equal 1 and less equal 5';
  }

  if (typeof value.rate_star !== 'number') {
    errors.rate_star = 'rate_star must be numberic';
  }

  if (!value.rate_star) {
    errors.rate_star = 'Rate star field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

module.exports = {
  createReview,
};
