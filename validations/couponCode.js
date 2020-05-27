const validator = require('validator');
const moment = require('moment');

const isEmpty = require('./is-empty');

const createCoupon = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  value.code = !isEmpty(value.code) ? value.code : '';
  value.type = !isEmpty(value.type) ? value.type : '';
  value.date_start = !isEmpty(value.date_start) ? value.date_start : '';
  value.date_end = !isEmpty(value.date_end) ? value.date_end : '';

  if (validator.isEmpty(value.code)) {
    errors.code = 'Code field is required';
  }

  const types = ['hotel', 'tour'];

  if (!types.includes(value.type)) {
    errors.type = 'Type of coupon code must be hotel or tour';
  }

  if (validator.isEmpty(value.type)) {
    errors.type = 'Type of coupon code field is required';
  }

  const date_start = value.date_start.split('/');
  const m_date_start = moment(
    `${date_start[0]}/${date_start[1]}/${date_start[2]}`,
    'DD/MM/YYYY',
  );

  if (!m_date_start.isValid()) {
    errors.date_start = 'Date start must be DD/MM/YYYY';
  }

  if (validator.isEmpty(value.date_start)) {
    errors.date_start = 'Date start field is required';
  }

  const date_end = value.date_end.split('/');
  const m_date_end = moment(
    `${date_end[0]}/${date_end[1]}/${date_end[2]}`,
    'DD/MM/YYYY',
  );

  if (!m_date_end.isValid()) {
    errors.date_end = 'Date end must be DD/MM/YYYY';
  }

  if (validator.isEmpty(value.date_end)) {
    errors.date_end = 'Date end field is required';
  }

  if (value.type && value.type === 'hotel') {
    if (!value.hotel) {
      errors.hotel = 'Hotel field is required';
    }
  }

  if (value.type && value.type === 'tour') {
    if (!value.tour) {
      errors.tour = 'Tour field is required';
    }
  }

  if (typeof value.percent === 'number' && value.percent <= 0) {
    errors.percent = 'Percent must be greater than 0';
  }

  if (!(typeof value.percent === 'number')) {
    errors.percent = 'Percent field is required';
  }

  if (typeof value.quantity === 'number' && value.quantity <= 0) {
    errors.quantity = 'Quantity must be greater than 0';
  }

  if (!(typeof value.quantity === 'number')) {
    errors.quantity = 'Quantity field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

module.exports = {
  createCoupon,
};
