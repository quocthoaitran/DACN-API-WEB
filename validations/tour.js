const validator = require('validator');
const moment = require('moment');

const isEmpty = require('./is-empty');

const checkID = require('../helpers/checkIDExist');

const createTour = (data) => {
  const errors = {};
  const value = {
    ...data,
    group_size: `${data.group_size}`,
    price: `${data.price}`,
    city: `${data.city}`,
  };

  value.duration = !isEmpty(value.duration) ? value.duration : '';
  value.tour_type = !isEmpty(value.tour_type) ? value.tour_type : '';
  value.group_size = !isEmpty(value.group_size) ? value.group_size : '';
  value.price = !isEmpty(value.price) ? value.price : '';
  value.language_tour = !isEmpty(value.language_tour) ? value.language_tour : '';
  value.description = !isEmpty(value.description) ? value.description : '';
  value.city = !isEmpty(value.city) ? value.city : '';
  value.name = !isEmpty(value.name) ? value.name : '';
  value.departure_day = !isEmpty(value.departure_day) ? value.departure_day : '';

  if (validator.isEmpty(value.duration)) {
    errors.duration = 'Duration field is required';
  }

  if (validator.isEmpty(value.tour_type)) {
    errors.tour_type = 'Tour type field is required';
  }

  if (!validator.isNumeric(value.group_size)) {
    errors.group_size = 'Group size must be numberic';
  }

  if (validator.isEmpty(value.group_size)) {
    errors.group_size = 'Group size field is required';
  }

  if (!validator.isNumeric(value.price)) {
    errors.price = 'Price must be numberic';
  }

  if (validator.isEmpty(value.price)) {
    errors.price = 'Price field is required';
  }

  if (validator.isEmpty(value.language_tour)) {
    errors.language_tour = 'Language tour field is required';
  }

  if (validator.isEmpty(value.description)) {
    errors.description = 'Description field is required';
  }

  if (validator.isEmpty(value.city)) {
    errors.city = 'City field is required';
  }

  if (validator.isEmpty(value.name)) {
    errors.name = 'Name field is required';
  }

  const arrDate = value.departure_day.split('/');
  const m = moment(`${arrDate[0]}/${arrDate[1]}/${arrDate[2]}`, 'DD/MM/YYYY');

  if (!m.isValid()) {
    errors.departure_day = 'Departure day must be DD/MM/YYYY';
  }

  if (validator.isEmpty(value.departure_day)) {
    errors.departure_day = 'Departure day field is required';
  }

  let checkType = true;

  // eslint-disable-next-line no-unused-expressions
  value.itineraries && value.itineraries.forEach(async (itinerary) => {
    let check = false;
    try {
      check = await checkID(itinerary.location, 'Location');
    } catch (error) {
      console.log(error);
      check = false;
    }
    if (!check) {
      checkType = false;
    }
  });

  if (!checkType) {
    errors.itineraries = 'Itineraries must be contain location';
  }

  if (value.itineraries && value.itineraries.length === 0) {
    errors.itineraries = 'Itineraries must be least 1 element';
  }

  if (!value.itineraries) {
    errors.itineraries = 'Itineraries field is required';
  }

  if (value.images && value.images.length === 0) {
    errors.images = 'images must be least 1 element';
  }

  if (!value.images) {
    errors.images = 'Images field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

const updateTour = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  if (value.duration === '') {
    errors.duration = 'Duration field is required';
  }

  if (value.tour_type === '') {
    errors.tour_type = 'Tour type field is required';
  }

  if (value.group_size && typeof value.group_size !== 'number') {
    errors.group_size = 'Group size must be numberic';
  }

  if (value.price && typeof value.price === 'number') {
    errors.price = 'Price must be numberic';
  }

  if (value.language_tour === '') {
    errors.language_tour = 'Language tour field is required';
  }

  if (value.description === '') {
    errors.description = 'Description field is required';
  }

  if (value.city === '') {
    errors.city = 'City field is required';
  }

  if (value.name === '') {
    errors.name = 'Name field is required';
  }

  const arrDate = value.departure_day && value.departure_day.split('/');
  const m = value.departure_day ? moment(`${arrDate[0]}/${arrDate[1]}/${arrDate[2]}`, 'DD/MM/YYYY') : null;

  if (m && !m.isValid()) {
    errors.departure_day = 'Departure day must be DD/MM/YYYY';
  }

  let checkType = true;

  // eslint-disable-next-line no-unused-expressions
  value.itineraries && value.itineraries.forEach(async (itinerary) => {
    let check = false;
    try {
      check = await checkID(itinerary.location, 'Location');
    } catch (error) {
      console.log(error);
      check = false;
    }
    if (!check) {
      checkType = false;
    }
  });

  if (value.itineraries && !checkType) {
    errors.itineraries = 'Itineraries must be contain location';
  }

  if (value.itineraries && value.itineraries.length === 0) {
    errors.itineraries = 'Itineraries must be least 1 element';
  }

  if (value.images && value.images.length === 0) {
    errors.images = 'images must be least 1 element';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

module.exports = {
  createTour,
  updateTour,
};
