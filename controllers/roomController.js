const mongoose = require('mongoose');
const moment = require('moment');

const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

const validateRoom = require('../validations/room');

const validateCreateRoomInput = validateRoom.createRoom;
const validateUpdateRoomInput = validateRoom.updateRoom;

const getAllRoomsAvailable = async (req, res) => {
  let { checkin, checkout } = req.body;
  const { hotelId } = req.params;
  
  const arrDateCheckin = checkin.split('/');
  checkin = moment(`${arrDateCheckin[0]}/${arrDateCheckin[1]}/${arrDateCheckin[2]}`, 'DD/MM/YYYY').format();
  const arrDateCheckout = checkout.split('/');
  checkout = moment(`${arrDateCheckout[0]}/${arrDateCheckout[1]}/${arrDateCheckout[2]}`, 'DD/MM/YYYY').format();

  let roomsBooked = [];
  try {
    roomsBooked = await Booking.aggregate([
      {
        $match: {
          is_choose: true,
        },
      },
      {
        $lookup: {
          from: 'bookingitems',
          localField: 'booking_list',
          foreignField: '_id',
          as: 'booking_item',
        },
      },
      {
        $unwind: '$booking_item',
      },
      {
        $match: {
          $and: [
            {
              'booking_item.type': 'room',
            },
            {
              $or: [
                {
                  $and: [
                    {
                      'booking_item.date_start': {
                        $lte: new Date(checkin),
                      },
                    },
                    {
                      'booking_item.date_end': {
                        $gte: new Date(checkin),
                      },
                    },
                  ],
                },
                {
                  $and: [
                    {
                      'booking_item.date_start': {
                        $lte: new Date(checkout),
                      },
                    },
                    {
                      'booking_item.date_end': {
                        $gte: new Date(checkout),
                      },
                    },
                  ],
                },
                {
                  $and: [
                    {
                      'booking_item.date_start': {
                        $gte: new Date(checkin),
                      },
                    },
                    {
                      'booking_item.date_end': {
                        $lte: new Date(checkout),
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        $replaceRoot: { newRoot: '$booking_item' },
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
        $replaceRoot: { newRoot: '$room' },
      },
      {
        $match: {
          hotel: {
            $eq: mongoose.Types.ObjectId(hotelId),
          },
        },
      },
    ]);
  } catch (error) {
    console.log(error);
    roomsBooked = [];
  }

  const roomIds = roomsBooked.map((room => room._id));

  console.log(roomIds);

  let rooms = [];
  try {
    rooms = await Room.find({ _id: { $nin: roomIds }, hotel: mongoose.Types.ObjectId(hotelId) });
  } catch (error) {
    console.log(error);
    rooms = [];
  }

  return res.status(200).json({
    success: true,
    data: {
      rooms,
    },
  });
};

const getRoom = async (req, res) => {
  const errors = {};
  const { hotelId, roomId } = req.params;

  let hotel = null;
  try {
    hotel = await Hotel.findById(hotelId);
  } catch (error) {
    console.log(error);
    hotel = null;
  }

  if (!hotel) {
    errors.error = 'Hotel not found!';
    return res.status(404).json(
      {
        success: false,
        errors,
      },
    );
  }

  let room = null;
  try {
    room = await Room.findById(roomId).populate('hotel');
  } catch (error) {
    console.log(error);
    room = null;
  }

  if (!room) {
    errors.error = 'Room not found!';
    return res.status(404).json(
      {
        success: false,
        errors,
      },
    );
  }

  return res.status(200).json(
    {
      success: false,
      data: {
        room,
      },
    },
  );
};

const createRoom = async (req, res) => {
  const { errors, isValid } = validateCreateRoomInput({ ...req.body, images: req.files });
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
    errors.error = 'Hotel not found!';
    return res.status(404).json(
      {
        success: false,
        errors,
      },
    );
  }

  const images = req.files && req.files.map(file => file.path);

  const data = {
    ...req.body,
    images,
    rate: 0,
    hotel: hotelId,
  };

  const newRoom = new Room(data);

  let roomCreated = null;
  try {
    roomCreated = await newRoom.save();
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t create new room. Please try again later!';
    return res.status(500).json(
      {
        success: false,
        errors,
      },
    );
  }

  if (!roomCreated) {
    errors.error = 'Can\'t create new room. Please try again later!';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  hotel.rooms.push(roomCreated._id);

  try {
    await Hotel.findByIdAndUpdate(hotelId, { rooms: hotel.rooms });
  } catch (error) {
    console.log(error);

    try {
      await Room.findByIdAndDelete(roomCreated._id);
    } catch (error1) {
      console.log(error1);
    }

    errors.error = 'Can\'t create new room. Please try again later!';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  return res.status(200).json(
    {
      success: true,
      data: {
        roomCreated,
      },
    },
  );
};

const updateRoom = async (req, res) => {
  const { errors, isValid } = validateUpdateRoomInput({ ...req.body, images: req.files });
  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const { hotelId, roomId } = req.params;

  const data = {
    ...req.body,
  };

  let hotel = null;
  try {
    hotel = await Hotel.findById(hotelId);
  } catch (error) {
    console.log(error);
    hotel = null;
  }

  if (!hotel) {
    errors.error = 'Hotel not found!';
    return res.status(404).json({
      success: false,
      errors,
    });
  }

  let roomUpdated = null;
  try {
    roomUpdated = await Room.findByIdAndUpdate(roomId, data);
  } catch (error) {
    console.log(error);
    roomUpdated = null;
  }

  if (!roomUpdated) {
    errors.error = 'Can\'t update room. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let room = null;
  try {
    room = await Room.findById(roomUpdated._id);
  } catch (error) {
    console.log(error);
    room = null;
  }

  if (!room) {
    errors.error = 'Can\'t update room. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      roomUpdated: room,
    },
  });
};

const deleteRoom = async (req, res) => {
  const errors = {};
  const { hotelId, roomId } = req.params;

  let hotel = null;
  try {
    hotel = await Hotel.findById(hotelId);
  } catch (error) {
    console.log(error);
    hotel = null;
  }

  if (!hotel) {
    errors.error = 'Hotel not found!';
    return res.status(404).json(
      {
        success: false,
        errors,
      },
    );
  }

  let { rooms } = hotel;

  rooms = rooms.filter(room => room !== roomId);

  try {
    await Hotel.findByIdAndUpdate(hotelId, { rooms });
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t delete room. Please try again later!';
    return res.status(404).json(
      {
        success: false,
        errors,
      },
    );
  }

  let roomDeleted = null;
  try {
    roomDeleted = await Room.findByIdAndDelete(roomId);
  } catch (error) {
    console.log(error);
    roomDeleted = null;
  }

  if (!roomDeleted) {
    errors.error = 'Can\'t delete room. Please try again later!';
    return res.status(404).json(
      {
        success: false,
        errors,
      },
    );
  }

  return res.status(200).json(
    {
      success: false,
      data: {
        roomDeleted,
      },
    },
  );
};

module.exports = {
  getRoom,
  getAllRoomsAvailable,
  createRoom,
  updateRoom,
  deleteRoom,

};
