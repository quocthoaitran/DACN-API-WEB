const moment = require('moment');
const mongoose = require('mongoose');
const CouponCode = require('../models/CouponCode');
const Tour = require('../models/Tour');
const Hotel = require('../models/Hotel');

const validateCoupon = require('../validations/couponCode');

const validateCreateCouponInput = validateCoupon.createCoupon;

const getAllCouponCodes = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  let couponCodes = [];
  try {
    couponCodes = await CouponCode.find().skip(skip).limit(limit);
  } catch (error) {
    console.log(error);
    couponCodes = [];
  }

  let total_couponCodes = [];
  try {
    total_couponCodes = await CouponCode.countDocuments();
  } catch (error) {
    console.log(error);
    total_couponCodes = [];
  }

  const total_page = Math.ceil(total_couponCodes / page_size);

  return res.status(200).json({
    success: true,
    data: {
      couponCodes,
    },
    meta: {
      page,
      page_size: couponCodes.length,
      total_page,
      total_size: total_couponCodes,
    },
  });
};

const getAllCouponCodesOwnUser = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  const creater = req.user.profile;

  let couponCodes = [];
  try {
    couponCodes = await CouponCode.find({
      creater,
    }).skip(skip).limit(limit);
  } catch (error) {
    console.log(error);
    couponCodes = [];
  }

  let total_couponCodes = [];
  try {
    total_couponCodes = await CouponCode.find({
      creater,
    });
  } catch (error) {
    console.log(error);
    total_couponCodes = [];
  }

  const total_page = Math.ceil(total_couponCodes.length / page_size);

  return res.status(200).json({
    success: true,
    data: {
      couponCodes,
    },
    meta: {
      page,
      page_size: couponCodes.length,
      total_page,
      total_size: total_couponCodes.length,
    },
  });
};

const createCouponCode = async (req, res) => {
  const {
    errors,
    isValid,
  } = validateCreateCouponInput({
    ...req.body,
  });
  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let { date_start, date_end } = req.body;
  const { type, code, quantity } = req.body;

  const creater = req.user.profile;

  let checkExist = null;
  try {
    checkExist = await CouponCode.findOne({ code });
  } catch (error) {
    console.log(error);
    checkExist = null;
  }

  if (checkExist) {
    errors.error = 'This coupon code is exist.';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const objModel = {
    tour: Tour,
    hotel: Hotel,
  };

  let tourExist = null;
  try {
    tourExist = await objModel[type].findById(req.body[type]);
  } catch (error) {
    console.log(error);
    tourExist = null;
  }

  if (!tourExist) {
    errors.error = `${type} is not exist.`;
    return res.status(404).json({
      success: false,
      errors,
    });
  }

  const arrDateStart = date_start.split('/');
  date_start = moment(`${arrDateStart[0]}/${arrDateStart[1]}/${arrDateStart[2]}`, 'DD/MM/YYYY').format();

  const arrDateEnd = date_end.split('/');
  date_end = moment(`${arrDateEnd[0]}/${arrDateEnd[1]}/${arrDateEnd[2]}`, 'DD/MM/YYYY').format();

  const newCoupon = new CouponCode({
    ...req.body,
    code: code.toUpperCase(),
    available: quantity,
    date_start,
    date_end,
    creater,
  });

  let couponCreated = null;
  try {
    couponCreated = await newCoupon.save();
  } catch (error) {
    console.log(error);
    couponCreated = null;
  }

  if (!couponCreated) {
    errors.error = 'Can\'t create new coupon. Please try again later';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      coupon: couponCreated,
    },
  });
};

const checkCouponCode = async (req, res) => {
  const {
    items,
  } = req.body;

  const { code } = req.params;

  const itemsResult = [];

  for (let i = 0; i < items.length; i += 1) {
    const { type, id } = items[i];

    let couponCode = null;

    try {
      // eslint-disable-next-line no-await-in-loop
      couponCode = await CouponCode.findOne({
        code,
        type,
        [type]: mongoose.mongo.ObjectId(id),
        status: true,
        date_start: {
          $lte: new Date(),
        },
        date_end: {
          $gte: new Date(),
        },
      });
    } catch (error) {
      console.log(error);
      couponCode = null;
    }

    if (couponCode) {
      let { _id, available } = couponCode;
      available -= 1;

      let couponCodeResult = null;
      try {
        // eslint-disable-next-line no-await-in-loop
        couponCodeResult = await CouponCode
          .findOneAndUpdate({ _id, available: { $gt: 0 }, status: true }, { available });
      } catch (error) {
        console.log(error);
        couponCodeResult = null;
      }

      if (couponCodeResult) {
        itemsResult.push(couponCode);
      }
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      itemsResult,
    },
  });
};

const finishCouponCode = async (req, res) => {
  const errors = {};
  const {
    code,
  } = req.params;

  let couponCodeFinish = null;
  try {
    couponCodeFinish = await CouponCode.findOneAndUpdate({ code }, { status: false });
  } catch (error) {
    console.log(error);
    couponCodeFinish = null;
  }

  if (!couponCodeFinish) {
    errors.error = 'Can\'t finish coupon code. Please try again later';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let couponCode = null;
  try {
    couponCode = await CouponCode.findOne({ code });
  } catch (error) {
    console.log(error);
    couponCode = null;
  }

  if (!couponCode) {
    errors.error = 'Can\'t coupon code. Please try again later';
    return res.status(404).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      couponCode,
    },
  });
};

module.exports = {
  getAllCouponCodes,
  getAllCouponCodesOwnUser,
  createCouponCode,
  checkCouponCode,
  finishCouponCode,
};
