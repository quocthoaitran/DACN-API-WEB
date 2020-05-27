const validator = require('validator');
const isEmpty = require('./is-empty');

const createHotel = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  value.name = !isEmpty(value.name) ? value.name : '';
  value.description = !isEmpty(value.description) ? value.description : '';
  value.address = !isEmpty(value.address) ? value.address : '';
  value.city = !isEmpty(value.city) ? value.city : '';

  if (validator.isEmpty(value.name)) {
    errors.name = 'Name field is required';
  }

  if (validator.isEmpty(value.description)) {
    errors.description = 'Description field is required';
  }

  if (validator.isEmpty(value.address)) {
    errors.address = 'Address field is required';
  }

  if (validator.isEmpty(value.city)) {
    errors.city = 'City field is required';
  }

  if (value.facilities && value.facilities.length === 0) {
    errors.facilities = 'Facilities must be least 1 element';
  }

  if (!value.facilities) {
    errors.facilities = 'Facilities field is required';
  }

  if (value.images && value.images.length === 0) {
    errors.images = 'Images must be least 1 element';
  }

  if (!value.images) {
    errors.images = 'Images field is required';
  }

  if (value.rules && value.rules.length === 0) {
    errors.rules = 'Rules must be least 1 element';
  }

  if (!value.rules) {
    errors.rules = 'Rules field is required';
  }

  if (value.location && value.location.type !== 'Point') {
    errors.location = 'Location type must be a Point';
  }

  // const checkType = value.location && value.location.coordinates.reduce((result, item) => typeof item === 'number', true);

  // if (!checkType) {
  //   errors.location = 'Location coordinates must be numberic';
  // }

  if (value.location && value.location.coordinates && value.location.coordinates.length !== 2) {
    errors.location = 'Location coordinates must be contain Longitude and Latitude';
  }

  if (!value.location || Object.keys(value.location).length === 0) {
    errors.location = 'Location field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

const updateHotel = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  if (value.name === '') {
    errors.name = 'Name field is required';
  }

  if (value.description === '') {
    errors.description = 'Description field is required';
  }

  if (value.address === '') {
    errors.address = 'Address field is required';
  }

  if (value.city === '') {
    errors.address = 'City field is required';
  }

  if (value.facilities && value.facilities.length === 0) {
    errors.facilities = 'Facilities must be least 1 element';
  }

  if (value.rules && value.rules.length === 0) {
    errors.rules = 'Rules must be least 1 element';
  }

  if (value.location && value.location.type !== 'Point') {
    errors.location = 'Location type must be a Point';
  }

  // const checkType = value.location && value.location.coordinates.reduce((result, item) => typeof item === 'number', true);

  // if (!checkType) {
  //   errors.location = 'Location coordinates must be numberic';
  // }

  if (value.location && value.location.coordinates.length !== 2) {
    errors.location = 'Location coordinates must be contain Longitude and Latitude';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

module.exports = {
  createHotel,
  updateHotel,
};
