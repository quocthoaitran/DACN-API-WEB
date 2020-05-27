const AccessControl = require('accesscontrol');

const Permission = require('../models/Permission');

let grantList = [
  // Booking
  {
    role: '0',
    resource: 'booking',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'booking',
    action: 'read',
    possession: 'own',
    attributes: '*, parner',
  },
  {
    role: '2',
    resource: 'booking',
    action: 'create',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '2',
    resource: 'booking',
    action: 'read',
    possession: 'own',
    attributes: '*, member',
  },
  // City
  {
    role: '0',
    resource: 'city',
    action: 'create',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'city',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'city',
    action: 'update',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'city',
    action: 'delete',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'city',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '2',
    resource: 'airport',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  // Location
  {
    role: '0',
    resource: 'location',
    action: 'create',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'location',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'location',
    action: 'update',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'location',
    action: 'delete',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'location',
    action: 'create',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'location',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'location',
    action: 'update',
    possession: 'own',
    attributes: '*',
  },
  // Flight
  {
    role: '0',
    resource: 'flight',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  // Hotel
  {
    role: '0',
    resource: 'hotel',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'hotel',
    action: 'delete',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'hotel',
    action: 'create',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'hotel',
    action: 'read',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'hotel',
    action: 'update',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'hotel',
    action: 'delete',
    possession: 'own',
    attributes: '*',
  },
  // Room
  {
    role: '1',
    resource: 'room',
    action: 'create',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'room',
    action: 'read',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'room',
    action: 'update',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'room',
    action: 'delete',
    possession: 'own',
    attributes: '*',
  },
  // Tour
  {
    role: '0',
    resource: 'tour',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'tour',
    action: 'delete',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'tour',
    action: 'create',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'tour',
    action: 'read',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'tour',
    action: 'update',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'tour',
    action: 'delete',
    possession: 'own',
    attributes: '*',
  },
  // Review
  {
    role: '0',
    resource: 'review',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'review',
    action: 'delete',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'review',
    action: 'read',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '2',
    resource: 'review',
    action: 'create',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '2',
    resource: 'review',
    action: 'read',
    possession: 'own',
    attributes: '*',
  },
  // User
  {
    role: '0',
    resource: 'user',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'user',
    action: 'delete',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'user',
    action: 'update',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'user',
    action: 'update',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '2',
    resource: 'user',
    action: 'update',
    possession: 'own',
    attributes: '*',
  },
  // Favorite
  {
    role: '2',
    resource: 'favorite',
    action: 'read',
    possession: 'own',
    attributes: '*, member',
  },
  {
    role: '2',
    resource: 'favorite',
    action: 'create',
    possession: 'own',
    attributes: '*',
  },
  // Coupon code
  {
    role: '0',
    resource: 'couponcode',
    action: 'create',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'couponcode',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'couponcode',
    action: 'update',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'couponcode',
    action: 'read',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'couponcode',
    action: 'read',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'couponcode',
    action: 'update',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '2',
    resource: 'couponcode',
    action: 'update',
    possession: 'any',
    attributes: '*',
  },
  // Discount
  {
    role: '0',
    resource: 'discount',
    action: 'read',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'discount',
    action: 'create',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '0',
    resource: 'discount',
    action: 'delete',
    possession: 'any',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'discount',
    action: 'read',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'discount',
    action: 'create',
    possession: 'own',
    attributes: '*',
  },
  {
    role: '1',
    resource: 'discount',
    action: 'delete',
    possession: 'own',
    attributes: '*',
  },
];

const permissionInit = async () => {
  let grants = [];
  try {
    grants = await Permission.find();
  } catch (error) {
    console.log(error);
  }

  if (grants.length === 0) {
    grantList = grantList.map(grant => ({
      ...grant,
      attributes: grant.attributes.split(', '),
    }));

    try {
      await Permission.insertMany(grantList);
    } catch (error) {
      console.log(error);
    }
    grants = [...grantList];
  }

  grants = grants.map(grant => ({
    resource: grant.resource,
    action: grant.action,
    possession: grant.possession,
    attributes: grant.attributes,
    role: `${grant.role}`,
  }));

  return new AccessControl(grants);
};

module.exports = permissionInit;
