const moment = require('moment');

const Discount = require('../models/Discount');
const validateDiscount = require('../validations/discount');

const validateCreateDiscountInput = validateDiscount.createDiscount;

const getAllDiscounts = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  let discounts = [];
  try {
    discounts = await Discount.find().skip(skip).limit(limit);
  } catch (error) {
    console.log(error);
    discounts = [];
  }

  let total_discounts = [];
  try {
    total_discounts = await Discount.countDocuments();
  } catch (error) {
    console.log(error);
    total_discounts = [];
  }

  const total_page = Math.ceil(total_discounts / page_size);

  return res.status(200).json({
    success: true,
    data: {
      discounts,
    },
    meta: {
      page,
      page_size: discounts.length,
      total_page,
      tour_size: total_discounts,
    },
  });
};

const getAllDiscountsOwnUser = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  const creater = req.user.profile;

  let discounts = [];
  try {
    discounts = await Discount.find({
      creater,
    }).skip(skip).limit(limit);
  } catch (error) {
    console.log(error);
    discounts = [];
  }

  let total_discounts = [];
  try {
    total_discounts = await Discount.find({
      creater,
    });
  } catch (error) {
    console.log(error);
    total_discounts = [];
  }

  const total_page = Math.ceil(total_discounts.length / page_size);

  return res.status(200).json({
    success: true,
    data: {
      discounts,
    },
    meta: {
      page,
      page_size: discounts.length,
      total_page,
      tour_size: total_discounts.length,
    },
  });
};

const getDiscount = async (req, res) => {
  const errors = {};
  const {
    discountId,
  } = req.params;

  let discount = null;
  try {
    discount = await Discount.findById(discountId).populate('creater');
  } catch (error) {
    console.log(error);
    discount = null;
  }

  if (!discount) {
    errors.error = 'Can\'t get discount item. Please try again later';
    return res.status(404).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      discount,
    },
  });
};

const createDiscount = async (req, res) => {
  const {
    errors,
    isValid,
  } = validateCreateDiscountInput({
    ...req.body,
  });
  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let { date_start, date_end } = req.body;

  const creater = req.user.profile;

  const arrDateStart = date_start.split('/');
  date_start = moment(`${arrDateStart[0]}/${arrDateStart[1]}/${arrDateStart[2]}`, 'DD/MM/YYYY').format();

  const arrDateEnd = date_end.split('/');
  date_end = moment(`${arrDateEnd[0]}/${arrDateEnd[1]}/${arrDateEnd[2]}`, 'DD/MM/YYYY').format();


  const newDiscount = new Discount({
    ...req.body,
    date_start,
    date_end,
    creater,
  });

  let discountCreated = null;
  try {
    discountCreated = await newDiscount.save();
  } catch (error) {
    console.log(error);
    discountCreated = null;
  }

  if (!discountCreated) {
    errors.error = 'Can\'t create new discount. Please try again later';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      discount: discountCreated,
    },
  });
};


const deleteDiscount = async (req, res) => {
  const errors = {};
  const {
    discountId,
  } = req.params;

  let discountDeleted = null;
  try {
    discountDeleted = await Discount.findByIdAndDelete(discountId);
  } catch (error) {
    console.log(error);
  }

  if (!discountDeleted) {
    errors.error = 'Can\'t delete discount. Please try again later';
    return res.status(404).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      discountDeleted,
    },
  });
};


module.exports = {
  getAllDiscounts,
  getAllDiscountsOwnUser,
  getDiscount,
  createDiscount,
  deleteDiscount,
};
