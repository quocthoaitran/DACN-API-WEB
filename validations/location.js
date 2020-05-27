const validator = require('validator');
const isEmpty = require('./is-empty');

const createLocation = (data) => {
  const errors = {};
  const value = {
    ...data,
    city: `${data.city}`,
    location: data.location ? JSON.stringify(data.location) : data.location,
  };

  value.name = !isEmpty(value.name) ? value.name : '';
  value.address = !isEmpty(value.address) ? value.address : '';
  value.city = !isEmpty(value.city) ? value.city : '';
  value.location = !isEmpty(value.location) ? value.location : '';

  if (validator.isEmpty(value.name)) {
    errors.name = 'Name field is required';
  }

  if (validator.isEmpty(value.address)) {
    errors.address = 'Address field is required';
  }

  if (validator.isEmpty(value.city)) {
    errors.city = 'City field is required';
  }

  if (value.location && JSON.parse(value.location).type !== 'Point') {
    errors.location = 'Location type must be a Point';
  }

  const checkType = value.location && JSON.parse(value.location).coordinates.reduce((result, item) => typeof item === 'number', true);

  if (!checkType) {
    errors.location = 'Location coordinates must be numberic';
  }

  if (value.location && JSON.parse(value.location).coordinates.length !== 2) {
    errors.location = 'Location coordinates must be contain Longitude and Latitude';
  }

  if (validator.isEmpty(value.location)) {
    errors.location = 'Location field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

const updateLocation = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  if (value.name === '') {
    errors.name = 'Name field is required';
  }

  if (value.address === '') {
    errors.address = 'Address field is required';
  }

  if (value.city === '') {
    errors.city = 'City field is required';
  }

  if (value.location && value.location.type !== 'Point') {
    errors.location = 'Location type must be a Point';
  }

  const checkType = value.location ? value.location.coordinates.reduce((result, item) => typeof item === 'number', true) : true;

  if (!checkType) {
    errors.location = 'Location coordinates must be numberic';
  }

  if (value.location && value.location.coordinates.length !== 2) {
    errors.location = 'Location coordinates must be contain Longitude and Latitude';
  }

  if (value.location && typeof value.location !== 'object') {
    errors.location = 'Location field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

module.exports = {
  createLocation,
  updateLocation,
};
