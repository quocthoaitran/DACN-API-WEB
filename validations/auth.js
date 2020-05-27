const validator = require('validator');
const isEmpty = require('./is-empty');

const login = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  value.email = !isEmpty(value.email) ? value.email : '';
  value.password = !isEmpty(value.password) ? value.password : '';

  if (!validator.isEmail(value.email)) {
    errors.email = 'Email is invaild';
  }

  if (validator.isEmpty(value.email)) {
    errors.email = 'Email field is required';
  }

  if (!validator.isLength(value.password, { min: 6, max: 30 })) {
    errors.password = 'Password must be between 6 characters and 30 characters';
  }

  if (validator.isEmpty(value.password)) {
    errors.password = 'Password field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

const register = (data) => {
  const errors = {};
  const value = {
    ...data,
    role: `${data.role}`,
  };

  value.email = !isEmpty(value.email) ? value.email : '';
  value.password = !isEmpty(value.password) ? value.password : '';
  value.password2 = !isEmpty(value.password2) ? value.password2 : '';
  value.firstname = !isEmpty(value.firstname) ? value.firstname : '';
  value.lastname = !isEmpty(value.lastname) ? value.lastname : '';
  value.role = !isEmpty(value.role) ? value.role : '';

  if (!validator.isEmail(value.email)) {
    errors.email = 'Email is invaild';
  }

  if (validator.isEmpty(value.email)) {
    errors.email = 'Email field is required';
  }

  if (!validator.isLength(value.password, { min: 6, max: 30 })) {
    errors.password = 'Password must be between 6 characters and 30 characters';
  }

  if (validator.isEmpty(value.password)) {
    errors.password = 'Password field is required';
  }

  if (!validator.equals(value.password2, value.password)) {
    errors.password2 = 'Password and confirm password must be match';
  }

  if (validator.isEmpty(value.password2)) {
    errors.password2 = 'Confirm password field is required';
  }

  if (validator.isEmpty(value.firstname)) {
    errors.firstname = 'First name field is required';
  }

  if (validator.isEmpty(value.lastname)) {
    errors.lastname = 'Last name field is required';
  }

  if (!validator.isNumeric(value.role)) {
    errors.role = 'Role must be numberic';
  }

  if (validator.isEmpty(value.role)) {
    errors.role = 'Role field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

const resetPassword = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  value.email = !isEmpty(value.email) ? value.email : '';

  if (!validator.isEmail(value.email)) {
    errors.email = 'Email is invaild';
  }

  if (validator.isEmpty(value.email)) {
    errors.email = 'Email field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

const createPassword = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  value.password = !isEmpty(value.password) ? value.password : '';
  value.password2 = !isEmpty(value.password2) ? value.password2 : '';

  if (!validator.isLength(value.password, { min: 6, max: 30 })) {
    errors.password = 'Password must be between 6 characters and 30 characters';
  }

  if (validator.isEmpty(value.password)) {
    errors.password = 'Password field is required';
  }

  if (!validator.equals(value.password2, value.password)) {
    errors.password2 = 'Password and confirm password must be match';
  }

  if (validator.isEmpty(value.password2)) {
    errors.password2 = 'Confirm password field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

const changePassword = (data) => {
  const errors = {};
  const value = {
    ...data,
  };

  value.old_password = !isEmpty(value.old_password) ? value.old_password : '';
  value.new_password = !isEmpty(value.new_password) ? value.new_password : '';
  value.new_password2 = !isEmpty(value.new_password2) ? value.new_password2 : '';

  if (validator.isEmpty(value.old_password)) {
    errors.old_password = 'Old password field is required';
  }

  if (!validator.isLength(value.new_password, { min: 6, max: 30 })) {
    errors.new_password = 'New password must be between 6 characters and 30 characters';
  }

  if (validator.isEmpty(value.new_password)) {
    errors.new_password = 'New password field is required';
  }

  if (!validator.equals(value.new_password2, value.new_password)) {
    errors.new_password2 = 'New password and confirm new password must be match';
  }

  if (validator.isEmpty(value.new_password2)) {
    errors.new_password2 = 'Confirm new password field is required';
  }

  return {
    isValid: isEmpty(errors),
    errors,
  };
};

module.exports = {
  login,
  register,
  resetPassword,
  createPassword,
  changePassword,
};
