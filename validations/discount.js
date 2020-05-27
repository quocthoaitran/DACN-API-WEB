const validator = require('validator');
const moment = require('moment');

const isEmpty = require('./is-empty');

const createDiscount = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  value.name = !isEmpty(value.name) ? value.name : '';
  value.type = !isEmpty(value.type) ? value.type : '';
  value.date_start = !isEmpty(value.date_start) ? value.date_start : '';
  value.date_end = !isEmpty(value.date_end) ? value.date_end : '';

  if (validator.isEmpty(value.name)) {
    errors.name = 'Name field is required';
  }

  const types = ['hotel', 'tour', 'all'];

  if (!types.includes(value.type)) {
    errors.type = 'Type of coupon code must be hotel, tour or all';
  }

  if (validator.isEmpty(value.type)) {
    errors.type = 'Type of Discount field is required';
  }

  if (validator.isEmpty(value.date_start)) {
    errors.date_start = 'Date start field is required';
  }

  const date_start = value.date_start.split('/');
  const m_date_start = moment(`${date_start[0]}/${date_start[1]}/${date_start[2]}`, 'DD/MM/YYYY');

  if (!m_date_start.isValid()) {
    errors.date_start = 'Date start must be DD/MM/YYYY';
  }


  // date end validation
  if (validator.isEmpty(value.date_end)) {
    errors.date_end = 'Date end field is required';
  }

  const date_end = value.date_end.split('/');
  const m_date_end = moment(`${date_end[0]}/${date_end[1]}/${date_end[2]}`, 'DD/MM/YYYY');

  if (!m_date_end.isValid()) {
    errors.date_end = 'Date end must be DD/MM/YYYY';
  }

  if (typeof value.percent === 'number' && value.percent <= 0) {
    errors.percent = 'Percent must be greater than 0';
  }

  if (!(typeof value.percent === 'number')) {
    errors.percent = 'Percent field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

module.exports = {
  createDiscount,
};
