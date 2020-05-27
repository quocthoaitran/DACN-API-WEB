const mongoose = require("mongoose");
const moment = require("moment");

const Tour = require("../models/Tour");
const Flight = require("../models/Flight");
const Room = require("../models/Room");
const Booking = require("../models/Booking");

const ObjectId = mongoose.Types.ObjectId;

module.exports = async (type, data) => {
  let check = false;
  const info = data[type];
  switch (type) {
    case "tour": {
      let tourChecked = null;
      try {
        tourChecked = await Tour.findOne({
          _id: info.ID,
          available: { $gte: info.quantity }
        });
      } catch (error) {
        console.log(error);
      }
      check = tourChecked ? true : false;
      return check;
    }
    case "flight": {
      let flightChecked = null;
      try {
        flightChecked = await Flight.findOne({ _id: info.ID });
      } catch (error) {
        console.log(error);
      }

      if (!flightChecked) {
        check = false;
        return check;
      }

      let flightBooked = [];
      try {
        flightBooked = await Booking.aggregate([
          {
            $match: {
              $or: [
                {
                  is_choose: true
                },
                {
                  status: true,
                }
              ]
            }
          },
          {
            $lookup: {
              from: "bookingitems",
              localField: "booking_list",
              foreignField: "_id",
              as: "booking_item"
            }
          },
          {
            $unwind: "$booking_item"
          },
          {
            $match: {
              $and: [
                {
                  "booking_item.type": type
                },
                {
                  "booking_item.flight": ObjectId(info.ID)
                }
              ]
            }
          }
        ]);
      } catch (error) {
        console.log(error);
      }

      check = !(flightBooked.length > 0) ? true : false;
      return check;
    }
    case "room": {
      const arrDateCheckin = info.checkin.split('/');
      const checkin = moment(`${arrDateCheckin[0]}/${arrDateCheckin[1]}/${arrDateCheckin[2]}`, 'DD/MM/YYYY').format();
      const arrDateCheckout = info.checkout.split('/');
      const checkout = moment(`${arrDateCheckout[0]}/${arrDateCheckout[1]}/${arrDateCheckout[2]}`, 'DD/MM/YYYY').format();

      let roomChecked = null;
      try {
        roomChecked = await Room.findById(info.ID);
      } catch (error) {
        console.log(error);
      }

      if (!roomChecked) {
        check = false;
        return check;
      }

      let roomBooked = [];
      try {
        roomBooked = await Booking.aggregate([
          {
            $match: {
              is_choose: true
            }
          },
          {
            $lookup: {
              from: "bookingitems",
              localField: "booking_list",
              foreignField: "_id",
              as: "booking_item"
            }
          },
          {
            $unwind: "$booking_item"
          },
          {
            $match: {
              $and: [
                {
                  "booking_item.type": type
                },
                {
                  "booking_item.room": ObjectId(info.ID)
                },
                {
                  $or: [
                    {
                      $and: [
                        {
                          "booking_item.date_start": {
                            $lte: new Date(checkin)
                          }
                        },
                        {
                          "booking_item.date_end": {
                            $gte: new Date(checkin)
                          }
                        }
                      ]
                    },
                    {
                      $and: [
                        {
                          "booking_item.date_start": {
                            $lte: new Date(checkout)
                          }
                        },
                        {
                          "booking_item.date_end": {
                            $gte: new Date(checkout)
                          }
                        }
                      ]
                    },
                    {
                      $and: [
                        {
                          "booking_item.date_start": {
                            $gte: new Date(checkin)
                          }
                        },
                        {
                          "booking_item.date_end": {
                            $lte: new Date(checkout)
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          },
        ]);
      } catch (error) {
        console.log(error);
      }

      check = roomBooked.length === 0;
      return check;
    }
    default:
      return false;
  }
};
