const City = require('../models/City');
const Location = require('../models/Location');
const Tour = require('../models/Tour')
const Hotel = require('../models/Hotel')
const Room = require('../models/Room')

const Profile = require('../models/Profile')

module.exports = async (ID, type) => {
  let check = false;
  switch (type) {
    case 'City':
      {
        try {
          check = await City.findById(ID);
        } catch (error) {
          console.log(error);
          check = false;
        }
        check = check ? true : false;
        return check;
      }
    case 'Location':
      {
        try {
          check = await Location.findById(ID);
        } catch (error) {
          console.log(error);
          check = false;
        }
        check = check ? true : false;
        return check;
      }
    case 'Tour':
      {
        try {
          check = await Tour.findById(ID);
        } catch (error) {
          console.log(error);
          check = false;
        }
        check = check ? true : false;
        return check;
      }

    case 'Hotel':
      {
        try {
          check = await Hotel.findById(ID);
        } catch (error) {
          console.log(error);
          check = false;
        }
        check = check ? true : false;
        return check;
      }

    case 'Room':
      {
        try {
          check = await Room.findById(ID);
        } catch (error) {
          console.log(error);
          check = false;
        }
        check = check ? true : false;
        return check;
      }

    case 'Profile':
      {
        try {
          check = await Profile.findById(ID);
        } catch (error) {
          console.log(error);
          check = false;
        }
        check = check ? true : false;
        return check;
      }
    default:
      return false;
  }
};