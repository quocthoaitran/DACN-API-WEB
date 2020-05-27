const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');

const Review = require('../models/Review');
const Tour = require('../models/Tour');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

const validateReview = require('../validations/review');

const validateCreateReviewInput = validateReview.createReview;

const getAllReviews = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 10;

  const skip = page_size * (page - 1);
  const limit = page_size;

  let reviews = [];
  try {
    reviews = await Review.find()
      .populate('reviewer')
      .populate('hotel')
      .populate('room')
      .populate('tour')
      .skip(skip)
      .limit(limit);
  } catch (error) {
    console.log(error);
    reviews = [];
  }

  let total_reviews = [];
  try {
    total_reviews = await Review.countDocuments();
  } catch (error) {
    console.log(error);
    total_reviews = [];
  }

  const total_page = Math.ceil(total_reviews / page_size);

  return res.status(200).json({
    success: true,
    data: {
      reviews,
    },
    meta: {
      page,
      page_size: reviews.length,
      total_page,
      total_size: total_reviews,
    },
  });
};

const getAllReviewsOwnMember = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 10;

  const skip = page_size * (page - 1);
  const limit = page_size;

  const reviewer = req.user.profile;

  let reviews = [];
  try {
    reviews = await Review.find({ reviewer }).skip(skip).limit(limit);
  } catch (error) {
    console.log(error);
    reviews = [];
  }

  let total_reviews = [];
  try {
    total_reviews = await Review.find({ reviewer });
  } catch (error) {
    console.log(error);
    total_reviews = [];
  }

  const total_page = Math.ceil(total_reviews.length / page_size);

  return res.status(200).json({
    success: true,
    data: {
      reviews,
    },
    meta: {
      page,
      page_size: reviews.length,
      total_page,
      total_size: total_reviews.length,
    },
  });
};

const getAllReviewsOwnPartner = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 10;

  const skip = page_size * (page - 1);
  const limit = page_size;

  const partner = req.user.profile;

  let reviewsOfTour = [];
  try {
    reviewsOfTour = await Review.aggregate([
      {
        $match: {
          type: 'tour',
        },
      },
      {
        $lookup:
         {
           from: 'tours',
           localField: 'tour',
           foreignField: '_id',
           as: 'tour',
         },
      },
      {
        $unwind: '$tour',
      },
      {
        $match: {
          'tour.owner': partner,
        },
      },
    ]);
  } catch (error) {
    console.log(error);
    reviewsOfTour = [];
  }

  let reviewsOfHotel = [];
  try {
    reviewsOfHotel = await Review.aggregate([
      {
        $match: {
          type: 'hotel',
        },
      },
      {
        $lookup:
         {
           from: 'hotels',
           localField: 'hotel',
           foreignField: '_id',
           as: 'hotel',
         },
      },
      {
        $unwind: '$hotel',
      },
      {
        $match: {
          'hotel.owner': partner,
        },
      },
    ]);
  } catch (error) {
    console.log(error);
    reviewsOfHotel = [];
  }

  let reviewsOfRoom = [];
  try {
    reviewsOfRoom = await Review.aggregate([
      {
        $match: {
          type: 'room',
        },
      },
      {
        $lookup:
         {
           from: 'rooms',
           localField: 'room',
           foreignField: '_id',
           as: 'room',
         },
      },
      {
        $unwind: '$room',
      },
      {
        $lookup:
         {
           from: 'hotels',
           localField: 'room.hotel',
           foreignField: '_id',
           as: 'hotel',
         },
      },
      {
        $unwind: '$hotel',
      },
      {
        $match: {
          'hotel.owner': partner,
        },
      },
    ]);
  } catch (error) {
    console.log(error);
    reviewsOfRoom = [];
  }

  let reviews = [...reviewsOfTour, ...reviewsOfHotel, ...reviewsOfRoom];

  reviews.sort((a, b) => {
    const isAfter = moment(a.updatedAt).isAfter(b.updatedAt);
    return isAfter ? -1 : 1;
  });

  const total_page = Math.ceil(reviews.length / page_size);

  if (reviews.length > 0 && total_page >= page) {
    reviews = _.chunk(reviews, page_size)[page - 1];
  } else {
    reviews = [];
  }

  return res.status(200).json({
    success: true,
    data: {
      reviews,
    },
    meta: {
      page,
      page_size: reviews.length,
      total_page,
    },
  });
};

const getAllReviewsOfTour = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 6;

  const skip = page_size * (page - 1);
  const limit = page_size;

  const { tourId } = req.params;

  let reviews = [];
  try {
    reviews = await Review.find({ type: 'tour', tour: mongoose.mongo.ObjectId(tourId) }).populate('reviewer')
      .sort({ createdAt: -1 }).skip(skip)
      .limit(limit);
  } catch (error) {
    console.log(error);
    reviews = [];
  }

  let total_reviews = [];
  try {
    total_reviews = await Review.find({ type: 'tour', tour: tourId });
  } catch (error) {
    console.log(error);
    total_reviews = [];
  }

  const total_page = Math.ceil(total_reviews.length / page_size);

  return res.status(200).json({
    success: true,
    data: {
      reviews,
    },
    meta: {
      page,
      page_size: reviews.length,
      total_page,
      total_size: total_reviews.length,
    },
  });
};

const getAllReviewsOfHotel = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 6;

  const skip = page_size * (page - 1);
  const limit = page_size;

  const { hotelId } = req.params;

  let reviews = [];
  try {
    reviews = await Review.find({ type: 'hotel', hotel: mongoose.mongo.ObjectId(hotelId) }).populate('reviewer')
      .sort({ createdAt: -1 }).skip(skip)
      .limit(limit);
  } catch (error) {
    console.log(error);
    reviews = [];
  }

  let total_reviews = [];
  try {
    total_reviews = await Review.find({ type: 'hotel', hotel: hotelId });
  } catch (error) {
    console.log(error);
    total_reviews = [];
  }

  const total_page = Math.ceil(total_reviews.length / page_size);

  return res.status(200).json({
    success: true,
    data: {
      reviews,
    },
    meta: {
      page,
      page_size: reviews.length,
      total_page,
      total_size: total_reviews.length,
    },
  });
};

const createReviewTour = async (req, res) => {
  const { errors, isValid } = validateCreateReviewInput({ ...req.body });
  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const { tourId } = req.params;

  let tour = null;
  try {
    tour = await Tour.findById(tourId);
  } catch (error) {
    console.log(error);
    tour = null;
  }

  if (!tour) {
    errors.error = 'Tour not found!';
    return res.status(404).json({
      success: false,
      errors,
    });
  }

  const reviewer = req.user.profile;

  let tourUserBooked = [];
  try {
    tourUserBooked = await Booking.aggregate([
      {
        $match: {
          buyer: reviewer,
          status: true,
        },
      },
      {
        $lookup: {
          from: 'bookingitems',
          localField: 'booking_list',
          foreignField: '_id',
          as: 'booking_list',
        },
      },
      {
        $unwind: '$booking_list',
      },
      {
        $match: {
          'booking_list.tour': tour._id,
        },
      },
    ]);
  } catch (error) {
    console.log(error);
    tourUserBooked = [];
  }

  if (tourUserBooked.length === 0) {
    errors.error = 'This user don\'t booked this tour';
    return res.status(404).json({
      success: false,
      errors,
    });
  }

  const data = {
    ...req.body,
    type: 'tour',
    tour: tourId,
    reviewer,
  };

  const newReview = new Review(data);

  let reviewCreated = null;
  try {
    reviewCreated = await newReview.save();
  } catch (error) {
    console.log(error);
    reviewCreated = null;
  }

  if (!newReview) {
    errors.error = 'Can\'t create review. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let { rate, num_review } = tour;
  rate = ((rate * num_review) + reviewCreated.rate_star) / (num_review + 1);
  num_review += 1;

  try {
    await Tour.findByIdAndUpdate(tourId, { rate, num_review });
  } catch (error) {
    console.log(error);
    try {
      await Review.findByIdAndDelete(reviewCreated._id);
    } catch (error1) {
      console.log(error1);
    }
    errors.error = 'Can\'t create review. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let review = null;
  try {
    review = await Review.findById(reviewCreated._id).populate('reviewer');
  } catch (error) {
    console.log(error);
    review = null;
  }

  if (!review) {
    errors.error = 'Can\'t create review. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      reviewCreated: review,
    },
  });
};

const createReviewHotel = async (req, res) => {
  const { errors, isValid } = validateCreateReviewInput({ ...req.body });
  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const { hotelId } = req.params;

  let hotel = null;
  try {
    hotel = await Hotel.findById(hotelId);
  } catch (error) {
    console.log(error);
    hotel = null;
  }

  if (!hotel) {
    errors.error = 'hotel not found!';
    return res.status(404).json({
      success: false,
      errors,
    });
  }

  const reviewer = req.user.profile;

  let hotelUserBooked = [];
  try {
    hotelUserBooked = await Booking.aggregate([
      {
        $match: {
          buyer: reviewer,
          status: true,
        },
      },
      {
        $lookup: {
          from: 'bookingitems',
          localField: 'booking_list',
          foreignField: '_id',
          as: 'booking_list',
        },
      },
      {
        $unwind: '$booking_list',
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'booking_list.room',
          foreignField: '_id',
          as: 'booking_list.room',
        },
      },
      {
        $project: {
          room: '$booking_list.room',
        },
      },
      {
        $unwind: '$room',
      },
      {
        $match: {
          'room.hotel': hotel._id,
        },
      },
    ]);
  } catch (error) {
    console.log(error);
    hotelUserBooked = [];
  }

  if (hotelUserBooked.length === 0) {
    errors.error = 'This user don\'t booked this room';
    return res.status(404).json({
      success: false,
      errors,
    });
  }

  const data = {
    ...req.body,
    type: 'hotel',
    hotel: hotelId,
    reviewer,
  };

  const newReview = new Review(data);

  let reviewCreated = null;
  try {
    reviewCreated = await newReview.save();
  } catch (error) {
    console.log(error);
    reviewCreated = null;
  }

  if (!newReview) {
    errors.error = 'Can\'t create review. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let { rate, num_review } = hotel;
  rate = ((rate * num_review) + reviewCreated.rate_star) / (num_review + 1);
  num_review += 1;
  try {
    await Hotel.findByIdAndUpdate(hotelId, { rate, num_review });
  } catch (error) {
    console.log(error);
    try {
      await Review.findByIdAndDelete(reviewCreated._id);
    } catch (error1) {
      console.log(error1);
    }
    errors.error = 'Can\'t create review. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let review = null;
  try {
    review = await Review.findById(reviewCreated._id).populate('reviewer');
  } catch (error) {
    console.log(error);
    review = null;
  }

  if (!review) {
    errors.error = 'Can\'t create review. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      reviewCreated: review,
    },
  });
};

const createReviewRoom = async (req, res) => {
  const { errors, isValid } = validateCreateReviewInput({ ...req.body });
  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const { roomId } = req.params;

  let room = null;
  try {
    room = await Room.findById(roomId);
  } catch (error) {
    console.log(error);
    room = null;
  }

  if (!room) {
    errors.error = 'Room not found!';
    return res.status(404).json({
      success: false,
      errors,
    });
  }

  const reviewer = req.user.profile;

  let roomUserBooked = [];
  try {
    roomUserBooked = await Booking.aggregate([
      {
        $match: {
          buyer: reviewer,
          status: true,
        },
      },
      {
        $lookup: {
          from: 'bookingitems',
          localField: 'booking_list',
          foreignField: '_id',
          as: 'booking_list',
        },
      },
      {
        $unwind: '$booking_list',
      },
      {
        $match: {
          'booking_list.room': room._id,
        },
      },
    ]);
  } catch (error) {
    console.log(error);
    roomUserBooked = [];
  }

  if (roomUserBooked.length === 0) {
    errors.error = 'This user don\'t booked this room';
    return res.status(404).json({
      success: false,
      errors,
    });
  }

  const data = {
    ...req.body,
    type: 'room',
    room: roomId,
    reviewer,
  };

  const newReview = new Review(data);

  let reviewCreated = null;
  try {
    reviewCreated = await newReview.save();
  } catch (error) {
    console.log(error);
    reviewCreated = null;
  }

  if (!newReview) {
    errors.error = 'Can\'t create review. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let { rate, num_review } = room;
  rate = ((rate * num_review) + reviewCreated.rate_star) / (num_review + 1);
  num_review += 1;

  try {
    await Room.findByIdAndUpdate(roomId, { rate, num_review });
  } catch (error) {
    console.log(error);
    try {
      await Review.findByIdAndDelete(reviewCreated._id);
    } catch (error1) {
      console.log(error1);
    }
    errors.error = 'Can\'t create review. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let review = null;
  try {
    review = await Review.findById(reviewCreated._id).populate('reviewer');
  } catch (error) {
    console.log(error);
    review = null;
  }

  if (!review) {
    errors.error = 'Can\'t create review. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      reviewCreated: review,
    },
  });
};

module.exports = {
  getAllReviews,
  getAllReviewsOwnMember,
  getAllReviewsOwnPartner,
  getAllReviewsOfTour,
  getAllReviewsOfHotel,
  createReviewTour,
  createReviewHotel,
  createReviewRoom,
};
