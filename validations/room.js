const validator = require('validator');
const isEmpty = require('./is-empty');

const createRoom = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  value.name = !isEmpty(value.name) ? value.name : '';
  value.description = !isEmpty(value.description) ? value.description : '';

  if (validator.isEmpty(value.name)) {
    errors.name = 'Name field is required';
  }

  if (validator.isEmpty(value.description)) {
    errors.description = 'Description type field is required';
  }

  if (typeof value.square === 'number' && value.square <= 0) {
    errors.square = 'Square must be greater 0';
  }

  // if (typeof value.square !== 'number') {
  //   errors.square = 'Square must be numberic';
  // }

  if (!value.square) {
    errors.square = 'Square field is required';
  }

  if (typeof value.beds === 'number' && value.beds < 1) {
    errors.beds = 'Beds must be greater 1';
  }

  // if (typeof value.beds !== 'number') {
  //   errors.beds = 'Beds must be numberic';
  // }

  if (!value.beds) {
    errors.beds = 'Beds field is required';
  }

  if (typeof value.adults === 'number' && value.adults < 1) {
    errors.adults = 'Adults must be greater 1';
  }

  // if (typeof value.adults !== 'number') {
  //   errors.adults = 'Adults must be numberic';
  // }

  if (!value.adults) {
    errors.adults = 'Adults field is required';
  }

  if (typeof value.children === 'number' && value.children < 0) {
    errors.children = 'Children must be greater equal 0';
  }

  // if (typeof value.children !== 'number') {
  //   errors.children = 'Children must be numberic';
  // }

  if (!value.children) {
    errors.children = 'Children field is required';
  }

  if (typeof value.price === 'number' && value.price <= 0) {
    errors.price = 'Price must be greater 0';
  }

  // if (typeof value.price !== 'number') {
  //   errors.price = 'Price must be numberic';
  // }

  if (!value.price) {
    errors.price = 'Price field is required';
  }

  if (value.images && value.images.length === 0) {
    errors.images = 'Images must be least 1 element';
  }

  if (!value.images) {
    errors.images = 'Images field is required';
  }

  if (value.amenities && value.amenities.length === 0) {
    errors.amenities = 'Amenities must be least 1 element';
  }

  if (!value.amenities) {
    errors.amenities = 'Amenities field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

const updateRoom = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  if (value.name === '') {
    errors.name = 'Name field is required';
  }

  if (value.description === '') {
    errors.description = 'Description type field is required';
  }

  if (typeof value.square === 'number' && value.square <= 0) {
    errors.square = 'Square must be greater 0';
  }

  // if (typeof value.square !== 'number') {
  //   errors.square = 'Square must be numberic';
  // }

  if (typeof value.beds === 'number' && value.beds < 1) {
    errors.beds = 'Beds must be greater 1';
  }

  // if (typeof value.beds !== 'number') {
  //   errors.beds = 'Beds must be numberic';
  // }

  if (typeof value.adults === 'number' && value.adults < 1) {
    errors.adults = 'Adults must be greater 1';
  }

  // if (typeof value.adults !== 'number') {
  //   errors.adults = 'Adults must be numberic';
  // }

  if (typeof value.children === 'number' && value.children < 0) {
    errors.children = 'Children must be greater equal 0';
  }

  // if (typeof value.children !== 'number') {
  //   errors.children = 'Children must be numberic';
  // }

  if (typeof value.price === 'number' && value.price <= 0) {
    errors.price = 'Price must be greater 0';
  }

  // if (typeof value.price !== 'number') {
  //   errors.price = 'Price must be numberic';
  // }

  if (value.amenities && value.amenities.length === 0) {
    errors.amenities = 'Amenities must be least 1 element';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

module.exports = {
  createRoom,
  updateRoom,
};
