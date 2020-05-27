const _ = require('lodash');

const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');


module.exports = async (paymentID) => {
  let bookingItem = [];
  try {
    bookingItem = await Booking.aggregate([
      {
        $match: {
          paymentID,
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
    ]);
  } catch (error) {
    console.log(error);
    bookingItem = [];
  }

  if (bookingItem.length === 0) {
    return [];
  }

  const { booking_list } = bookingItem[0];

  const objItems = booking_list.reduce((obj, item) => {
    if (obj[item.type]) {
      obj[item.type] = [...obj[item.type], { id: item[item.type], price: item.price, quantity: item.quantity }];
    } else {
      obj[item.type] = [{ id: item[item.type], price: item.price, quantity: item.quantity }];
    }
    return obj;
  }, {});

  const types = Object.keys(objItems);

  let arrBooking = [];

  for (let i = 0; i < types.length; i += 1) {
    if (types[i] === 'tour') {
      const ids = objItems[types[i]].map(item => item.id);
      let tours = [];
      try {
        // eslint-disable-next-line no-await-in-loop
        tours = await Tour.find({ _id: { $in: ids } }).populate('owner');
      } catch (error) {
        console.log(error);
        tours = [];
      }

      const arrBookingTour = tours.map((tour, index) => {
        const { email_paypal } = tour.owner;
        const { name } = tour;
        const { price, quantity } = objItems[types[i]][index];
        return {
          email_paypal,
          items: [
            {
              name,
              price,
              quantity,
            },
          ],
        };
      });

      arrBooking = [...arrBooking, ...arrBookingTour];
    }

    if (types[i] === 'room') {
      const ids = objItems[types[i]].map(item => item.id);
      let rooms = [];
      try {
        // eslint-disable-next-line no-await-in-loop
        rooms = await Room.find({ _id: { $in: ids } }).populate(
          {
            path: 'hotel',
            populate: {
              path: 'owner',
              model: 'Profile',
            },
          },
        );
      } catch (error) {
        console.log(error);
        rooms = [];
      }

      const arrBookingRoom = rooms.map((room, index) => {
        const { email_paypal } = room.hotel.owner;
        const { name } = room;
        const { price, quantity } = objItems[types[i]][index];
        return {
          email_paypal,
          items: [
            {
              name,
              price,
              quantity,
            },
          ],
        };
      });

      arrBooking = [...arrBooking, ...arrBookingRoom];
    }
  }

  arrBooking = arrBooking.reduce((result, item) => {
    const indexItem = result.findIndex(itemBook => itemBook.email_paypal === item.email_paypal);
    if (indexItem !== -1) {
      result[indexItem].items = [...result[indexItem].items, ...item.items]
    } else {
      result.push(
        {
          email_paypal: item.email_paypal,
          items: item.items,
        },
      );
    }
    return result;
  }, []);
  return arrBooking;
};
