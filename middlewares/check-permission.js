const Tour = require('../models/Tour');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

const AccessControl = require('../helpers/permission');

const readAnyPer = (acr, resource, attributes) => acr.readAny(resource, attributes).granted;

const readOwnPer = async (acr, resource, attributes, req) => {
  const { profile } = req.user;
  let check = false;
  switch (resource) {
    case 'tour': {
      const { tourId } = req.params;
      let tourOfUser = null;
      try {
        tourOfUser = await Tour.findOne({
          _id: tourId,
          owner: profile,
        });
      } catch (error) {
        console.log(error);
        check = false;
      }

      if (!tourOfUser) {
        check = false;
      }
      check = true;
      break;
    }
    case 'hotel': {
      const { hotelId } = req.params;
      let hotelOfUser = null;
      try {
        hotelOfUser = await Hotel.findOne({
          _id: hotelId,
          owner: profile,
        });
      } catch (error) {
        console.log(error);
        check = false;
      }

      if (!hotelOfUser) {
        check = false;
      }

      check = true;
      break;
    }
    default:
      check = true;
  }
  return check && acr.readAny(resource, attributes).granted;
};

const createAnyPer = (acr, resource, attributes) => acr.createAny(resource, attributes).granted;

const createOwnPer = (acr, resource, attributes) => acr.createOwn(resource, attributes).granted;

const updateAnyPer = (acr, resource, attributes) => acr.updateAny(resource, attributes).granted;

const updateOwnPer = async (acr, resource, attributes, req) => {
  const { profile } = req.user;
  let check = false;
  switch (resource) {
    case 'tour': {
      const { tourId } = req.params;
      let tourOfUser = null;
      try {
        tourOfUser = await Tour.findOne({
          _id: tourId,
          owner: profile,
        });
      } catch (error) {
        console.log(error);
        check = false;
      }

      if (!tourOfUser) {
        check = false;
      }
      check = true;
      break;
    }
    case 'hotel': {
      const { hotelId } = req.params;
      let hotelOfUser = null;
      try {
        hotelOfUser = await Hotel.findOne({
          _id: hotelId,
          owner: profile,
        });
      } catch (error) {
        console.log(error);
        check = false;
      }

      if (!hotelOfUser) {
        check = false;
      }

      check = true;
      break;
    }
    case 'room': {
      const { roomId } = req.params;
      let roomOfUser = null;
      try {
        roomOfUser = await Room.findOne({
          _id: roomId,
        }).populate('hotel');
      } catch (error) {
        console.log(error);
        check = false;
      }

      if (!roomOfUser) {
        check = false;
      }

      if (profile !== roomOfUser.hotel.owner) {
        check = false;
      }

      check = true;
      break;
    }
    case 'user': {
      let user = null;
      try {
        user = await Room.findOne({
          _id: profile,
        });
      } catch (error) {
        console.log(error);
        check = false;
      }

      if (!user) {
        check = false;
      }

      check = true;
      break;
    }
    default:
      check = true;
  }
  return check && acr.updateOwn(resource, attributes).granted;
};

const deleteAnyPer = (acr, resource, attributes) => acr.deleteAny(resource, attributes).granted;

const deleteOwnPer = async (acr, resource, attributes, req) => {
  const { profile } = req.user;
  let check = false;
  switch (resource) {
    case 'tour': {
      const { tourId } = req.params;
      let tourOfUser = null;
      try {
        tourOfUser = await Tour.findOne({
          _id: tourId,
          owner: profile,
        });
      } catch (error) {
        console.log(error);
        check = false;
      }

      if (!tourOfUser) {
        check = false;
      }
      check = true;
      break;
    }
    case 'hotel': {
      const { hotelId } = req.params;
      let hotelOfUser = null;
      try {
        hotelOfUser = await Hotel.findOne({
          _id: hotelId,
          owner: profile,
        });
      } catch (error) {
        console.log(error);
        check = false;
      }

      if (!hotelOfUser) {
        check = false;
      }

      check = true;
      break;
    }
    case 'room': {
      const { roomId } = req.params;
      let roomOfUser = null;
      try {
        roomOfUser = await Room.findOne({
          _id: roomId,
        }).populate('hotel');
      } catch (error) {
        console.log(error);
        check = false;
      }

      if (!roomOfUser) {
        check = false;
      }

      if (profile !== roomOfUser.hotel.owner) {
        check = false;
      }

      check = true;
      break;
    }
    default:
      check = true;
  }
  return check && acr.deleteOwn(resource, attributes).granted;
};

const readAllOwnPer = async (
  acr,
  resource,
  attributes,
  req,
) => {
  const [type] = attributes;
  const objRole = {
    admin: 0,
    partner: 1,
    member: 2,
  };

  return objRole[type] === req.user.role && acr.readOwn(resource, attributes).granted;
};

const checkPermission = (resource, action, attributes) => async (req, res, next) => {
  const errors = {};
  let ac = null;
  try {
    ac = await AccessControl();
  } catch (error) {
    console.log(error);
    ac = null;
  }
  if (!ac) {
    errors.error = 'You don\'t have permission';
    return res.status(403).json({
      success: false,
      errors,
    });
  }

  const permissionObj = {
    'read:any': readAnyPer,
    'read:own': readOwnPer,
    'create:any': createAnyPer,
    'create:own': createOwnPer,
    'update:any': updateAnyPer,
    'update:own': updateOwnPer,
    'delete:any': deleteAnyPer,
    'delete:own': deleteOwnPer,
    'readAll:own': readAllOwnPer,
  };

  const acr = ac.can(`${req.user.role}`);

  let granted = false;
  try {
    granted = await permissionObj[action](acr, resource, attributes, req);
  } catch (error) {
    console.log(error);
    granted = false;
  }

  if (granted) {
    return next();
  }

  errors.error = 'You don\'t have permission';
  return res.status(403).json({
    success: false,
    errors,
  });
};

module.exports = {
  checkPermission,
};
