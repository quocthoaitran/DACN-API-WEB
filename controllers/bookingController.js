const paypal = require('paypal-rest-sdk');
const moment = require('moment');

const sendEmail = require('../helpers/sendEmail');

const Booking = require('../models/Booking');
const BookingItem = require('../models/BookingItem');
const Profile = require('../models/Profile');
const Tour = require('../models/Tour');
const Room = require('../models/Room');
const Flight = require('../models/Flight');
const Payment = require('../models/Payment');

const checkItemExist = require('../helpers/checkItemExist');
const getItemBookingOwnPartner = require('../helpers/getItemBookingOwnPartner');

const getAllBookings = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  let bookings = [];
  try {
    bookings = await Booking.find()
      .populate('booking_list')
      .populate('buyer')
      .skip(skip)
      .limit(limit);
  } catch (error) {
    console.log(error);
    bookings = [];
  }

  let total_bookings = [];
  try {
    total_bookings = await Booking.countDocuments();
  } catch (error) {
    console.log(error);
    total_bookings = [];
  }

  const total_page = Math.ceil(total_bookings / page_size);

  return res.status(200).json({
    success: true,
    data: {
      bookings,
    },
    meta: {
      page,
      page_size: bookings.length,
      total_page,
      total_size: total_bookings,
    },
  });
};

const getAllBookingsOwnMember = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  const buyer = req.user.profile;

  let bookings = [];
  try {
    bookings = await Booking.find({ buyer })
      .populate('booking_list')
      .populate('buyer').skip(skip)
      .limit(limit);
  } catch (error) {
    console.log(error);
    bookings = [];
  }

  let total_bookings = [];
  try {
    total_bookings = await Booking.find({ buyer });
  } catch (error) {
    console.log(error);
    total_bookings = [];
  }

  const total_page = Math.ceil(total_bookings.length / page_size);

  return res.status(200).json({
    success: true,
    data: {
      bookings,
    },
    meta: {
      page,
      page_size: bookings.length,
      total_page,
      total_size: total_bookings.length,
    },
  });
};

const getAllBookingsOwnPartner = async (req, res) => {
  const page = +req.query.page || 1;
  const page_size = 12;

  const skip = page_size * (page - 1);
  const limit = page_size;

  const partner = req.user.profile;

  let bookingsOfTour = [];
  try {
    bookingsOfTour = await Booking.aggregate([
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
          'booking_list.type': 'tour',
        },
      },
      {
        $lookup: {
          from: 'tours',
          localField: 'booking_list.tour',
          foreignField: '_id',
          as: 'booking_list.tour',
        },
      },
      {
        $unwind: '$booking_list.tour',
      },
      {
        $match: {
          'booking_list.tour.owner': partner,
        },
      },
    ]);
  } catch (error) {
    console.log(error);
    bookingsOfTour = [];
  }

  let bookingsOfRoom = [];
  try {
    bookingsOfRoom = await Booking.aggregate([
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
          'booking_list.type': 'room',
        },
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
        $unwind: '$booking_list.room',
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'booking_list.room.hotel',
          foreignField: '_id',
          as: 'booking_list.room.hotel',
        },
      },
      {
        $unwind: '$booking_list.room.hotel',
      },
      {
        $match: {
          'booking_list.room.hotel.owner': partner,
        },
      },
    ]);
  } catch (error) {
    console.log(error);
    bookingsOfRoom = [];
  }

  const bookingsId = [...bookingsOfTour, ...bookingsOfRoom].map(booking => booking._id);

  let bookings = [];

  try {
    bookings = await Booking.find({ _id: { $in: bookingsId } })
      .populate('booking_list')
      .sort({ updatedAt: -1 }).skip(skip)
      .limit(limit);
  } catch (error) {
    console.log(error);
    bookings = [];
  }

  let total_bookings = null;
  try {
    total_bookings = await Booking.find({ _id: { $in: bookingsId } });
  } catch (error) {
    console.log(error);
    total_bookings = [];
  }

  const total_page = Math.ceil(total_bookings.length / page_size);

  return res.status(200).json({
    success: true,
    data: {
      bookings,
    },
    meta: {
      page,
      page_size: bookings.length,
      total_page,
      total_size: total_bookings.length,
    },
  });
};

const bookItem = async (req, res) => {
  const errors = {};
  const { booking_list } = req.body;
  const buyerID = req.user.profile;

  let buyer = null;
  try {
    buyer = await Profile.findById(buyerID);
  } catch (error) {
    console.log(error);
    buyer = null;
  }

  if (!buyer) {
    errors.error = "You don't have permission";
    return res.status(403).json({
      success: false,
      errors,
    });
  }

  let isAvailable = true;

  for (let i = 0; i < booking_list.length; i += 1) {
    const booking_item = booking_list[i];
    const info = {
      tour: {
        ID: booking_item.id,
        quantity: booking_item.quantity,
      },
      flight: {
        ID: booking_item.id,
      },
      room: {
        ID: booking_item.id,
        checkin: booking_item.checkin,
        checkout: booking_item.checkout,
      },
    };
    // eslint-disable-next-line no-await-in-loop
    const check = await checkItemExist(booking_item.type, info);

    if (!check) {
      errors[booking_item.type] = `${booking_item.type} not available`;
      isAvailable = false;
    }
  }

  if (!isAvailable) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const bookingItemIDs = [];

  for (let i = 0; i < booking_list.length; i += 1) {
    const booking_item = booking_list[i];

    const bookingItemObj = {
      type: booking_item.type,
      [booking_item.type]: booking_item.id,
      price: booking_item.price,
      quantity: booking_item.quantity,
      customers: booking_item.customers,
    };

    if (booking_item.coupon_code) {
      bookingItemObj.coupon_code = booking_item.coupon_code;
    }

    if (booking_item.departure_day) {
      const arrDate = booking_item.departure_day.split('/');
      bookingItemObj.date_start = moment(`${arrDate[0]}/${arrDate[1]}/${arrDate[2]}`, 'DD/MM/YYYY').format();
    }

    if (booking_item.checkin && booking_item.checkout) {
      const arrDateCheckin = booking_item.checkin.split('/');
      bookingItemObj.date_start = moment(`${arrDateCheckin[0]}/${arrDateCheckin[1]}/${arrDateCheckin[2]}`, 'DD/MM/YYYY').format();
      const arrDateCheckout = booking_item.checkout.split('/');
      bookingItemObj.date_end = moment(`${arrDateCheckout[0]}/${arrDateCheckout[1]}/${arrDateCheckout[2]}`, 'DD/MM/YYYY').format();
    }

    const newBookingItem = new BookingItem(bookingItemObj);

    let bookingItemCreated = null;
    try {
      // eslint-disable-next-line no-await-in-loop
      bookingItemCreated = await newBookingItem.save();
    } catch (error) {
      console.log(error);
    }

    if (bookingItemCreated) {
      bookingItemIDs.push(bookingItemCreated._id);
    }
  }

  const listBookingItem = [];

  for (let i = 0; i < booking_list.length; i += 1) {
    const booking_item = booking_list[i];
    const itemObj = {
      tour: Tour,
      room: Room,
      flight: Flight,
    };

    let item = null;

    try {
      // eslint-disable-next-line no-await-in-loop
      item = await itemObj[booking_item.type].findById(booking_item.id);
    } catch (error) {
      console.log(error);
    }

    if (booking_item.type === 'tour') {
      try {
        // eslint-disable-next-line no-await-in-loop
        await Tour.findByIdAndUpdate(booking_item.id,
          {
            available: item.available - booking_item.quantity,
          });
      } catch (error) {
        console.log(error);
      }
    }

    listBookingItem.push(
      {
        name: item.name,
        price: booking_item.price,
        currency: 'USD',
        quantity: booking_item.quantity,
      },
    );
  }

  const amount = listBookingItem.reduce((result, bookingItem) => ({
    currency: 'USD',
    total: result.total + bookingItem.price * bookingItem.quantity,
  }), { currency: 'USD', total: 0 });

  const create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: process.env.URL_PAYMENT_SUCCESS,
      cancel_url: process.env.URL_PAYMENT_CANCEL,
    },
    transactions: [{
      item_list: {
        items: await listBookingItem,
      },
      amount,
      description: `Thanh toán booking của user: ${buyer.firstname} ${buyer.lastname}`,
    }],
  };

  paypal.payment.create(create_payment_json, async (error, payment) => {
    if (error) {
      console.log(error.response);
      return res.status(500).json(
        {
          success: false,
          errors: {
            error: 'Please try again later.',
          },
        },
      );
    }
    for (let i = 0; i < payment.links.length; i += 1) {
      if (payment.links[i].rel === 'approval_url') {
        const url_redirect = payment.links[i].href;

        const index = url_redirect.indexOf('token=');
        const token_paypal = url_redirect.slice(index + ('token=').length);
        const newBooking = new Booking(
          {
            booking_list: [...bookingItemIDs],
            total_price: payment.transactions[0].amount.total,
            buyer: buyerID,
            paymentID: payment.id,
            token_paypal,
            url_paypal: url_redirect,
          },
        );

        try {
          // eslint-disable-next-line no-await-in-loop
          await newBooking.save();
        } catch (error2) {
          console.log(error2);
        }

        return res.status(200).json(
          {
            success: true,
            data: {
              url_redirect,
            },
          },
        );
      }
    }
  });
};

const bookSuccess = async (req, res) => {
  const { paymentId, PayerID } = req.query;

  let bookingItem = null;
  try {
    bookingItem = await Booking.findOne({ paymentID: paymentId, status: false }).populate('buyer');
  } catch (error) {
    console.log(error);
  }

  if (!bookingItem) {
    return res.redirect(process.env.URL_REDIRECT_BOOKING_FAILED);
  }

  const execute_payment_json = {
    payer_id: PayerID,
    transactions: [
      {
        amount: {
          total: bookingItem.total_price,
          currency: 'USD',
        },
      },
    ],
  };

  paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
    if (error) {
      console.log(error.response);
      return res.redirect(process.env.URL_REDIRECT_BOOKING_FAILED);
    }

    const [transactionitem] = payment.transactions;
    const { amount } = transactionitem;
    const { items } = transactionitem.item_list;
    const bookingItemHtml = items.reduce((result, item) => {
      const itemHtml = `<tr style="border-collapse:collapse;"> 
      <td align="left" style="Margin:0;padding-top:5px;padding-bottom:10px;padding-left:20px;padding-right:20px;"> 
       <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="178" valign="top"><![endif]--> 
       <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left;"> 
         <tr style="border-collapse:collapse;"> 
          <td class="es-m-p0r es-m-p20b" width="178" valign="top" align="center" style="padding:0;Margin:0;"> 
           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
             <tr style="border-collapse:collapse;"> 
              <td align="center" style="padding:0;Margin:0;"> <img src="https://mixmap.travelerwp.com/wp-content/uploads/2017/06/TheCommonWanderer_-870x555.jpg" alt="Natural Balance L.I.D., sale 30%" class="adapt-img" title="Natural Balance L.I.D., sale 30%" width="125" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;"></td> 
             </tr> 
           </table> </td> 
         </tr> 
       </table> 
       <!--[if mso]></td><td width="20"></td><td width="362" valign="top"><![endif]--> 
       <table cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
         <tr style="border-collapse:collapse;"> 
          <td width="362" align="left" style="padding:0;Margin:0;"> 
           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="padding:0;Margin:0;"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;"><br></p> 
               <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;" class="cke_show_border" cellspacing="1" cellpadding="1" border="0"> 
                 <tr style="border-collapse:collapse;"> 
                  <td style="padding:0;Margin:0;">${item.name}</td> 
                  <td style="padding:0;Margin:0;text-align:center;" width="60">${item.quantity}</td> 
                  <td style="padding:0;Margin:0;text-align:center;" width="100">$ ${item.price}</td> 
                 </tr> 
               </table><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;"><br></p> </td> 
             </tr> 
           </table> </td> 
         </tr> 
       </table> 
       <!--[if mso]></td></tr></table><![endif]--> </td> 
     </tr> `;

      const spaceHtml = `
     <tr style="border-collapse:collapse;"> 
      <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;"> 
        <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
          <tr style="border-collapse:collapse;"> 
          <td width="560" valign="top" align="center" style="padding:0;Margin:0;"> 
            <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
              <tr style="border-collapse:collapse;"> 
              <td align="center" style="padding:0;Margin:0;padding-bottom:10px;"> 
                <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                  <tr style="border-collapse:collapse;"> 
                  <td style="padding:0;Margin:0px;border-bottom:1px solid #EFEFEF;background:rgba(0, 0, 0, 0) none repeat scroll 0% 0%;height:1px;width:100%;margin:0px;"></td> 
                  </tr> 
                </table> </td> 
              </tr> 
            </table> </td> 
          </tr> 
        </table> </td> 
      </tr> 
     `;
      return result + itemHtml + spaceHtml;
    }, '');

    const msg = {
      to: bookingItem.buyer.email,
      from: 'support@didauday.me',
      subject: 'Payment Notification',
      text: 'Hi, You are paid successfully!',
      html: `
      
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;">
 <head> 
  <meta charset="UTF-8"> 
  <meta content="width=device-width, initial-scale=1" name="viewport"> 
  <meta name="x-apple-disable-message-reformatting"> 
  <meta http-equiv="X-UA-Compatible" content="IE=edge"> 
  <meta content="telephone=no" name="format-detection"> 
  <title>booking info ngquangan</title> 
  <!--[if (mso 16)]>
    <style type="text/css">
    a {text-decoration: none;}
    </style>
    <![endif]--> 
  <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> 
  <style type="text/css">
@media only screen and (max-width:600px) {p, ul li, ol li, a { font-size:16px!important; line-height:150%!important } h1 { font-size:30px!important; text-align:center; line-height:120%!important } h2 { font-size:26px!important; text-align:center; line-height:120%!important } h3 { font-size:20px!important; text-align:center; line-height:120%!important } h1 a { font-size:30px!important } h2 a { font-size:26px!important } h3 a { font-size:20px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:16px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:block!important } a.es-button { font-size:20px!important; display:block!important; border-left-width:0px!important; border-right-width:0px!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } .es-desk-menu-hidden { display:table-cell!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-menu td a { font-size:16px!important } }
#outlook a {
	padding:0;
}
.ExternalClass {
	width:100%;
}
.ExternalClass,
.ExternalClass p,
.ExternalClass span,
.ExternalClass font,
.ExternalClass td,
.ExternalClass div {
	line-height:100%;
}
.es-button {
	mso-style-priority:100!important;
	text-decoration:none!important;
}
a[x-apple-data-detectors] {
	color:inherit!important;
	text-decoration:none!important;
	font-size:inherit!important;
	font-family:inherit!important;
	font-weight:inherit!important;
	line-height:inherit!important;
}
.es-desk-hidden {
	display:none;
	float:left;
	overflow:hidden;
	width:0;
	max-height:0;
	line-height:0;
	mso-hide:all;
}
</style> 
 </head> 
 <body style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;"> 
  <div class="es-wrapper-color" style="background-color:#EFEFEF;"> 
   <!--[if gte mso 9]>
			<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
				<v:fill type="tile" color="#efefef"></v:fill>
			</v:background>
		<![endif]--> 
   <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;"> 
     <tr style="border-collapse:collapse;"> 
      <td valign="top" style="padding:0;Margin:0;"> 
       <table class="es-header" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top;"> 
         <tr style="border-collapse:collapse;"> 
          <td align="center" style="padding:0;Margin:0;"> 
           <table class="es-header-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FEF5E4;"> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:15px;padding-right:15px;"> 
               <!--[if mso]><table width="570" cellpadding="0" cellspacing="0"><tr><td width="180" valign="top"><![endif]--> 
               <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td class="es-m-p0r" width="180" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="center" style="padding:0;Margin:0;display:none;"></td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> 
               <!--[if mso]></td><td width="20"></td><td width="370" valign="top"><![endif]--> 
               <table cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="370" align="left" style="padding:0;Margin:0;"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="center" style="padding:0;Margin:0;display:none;"></td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> 
               <!--[if mso]></td></tr></table><![endif]--> </td> 
             </tr> 
           </table> </td> 
         </tr> 
       </table> 
       <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;"> 
         <tr style="border-collapse:collapse;"> 
          <td align="center" style="padding:0;Margin:0;"> 
           <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;"> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:20px;padding-right:20px;"> 
               <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="560" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:0px;" width="100%" cellspacing="0" cellpadding="0"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:15px;"> <h1 style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:'trebuchet ms', helvetica, sans-serif;font-size:30px;font-style:normal;font-weight:normal;color:#333333;">Thanks for your booking</h1> </td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> </td> 
             </tr> 
           </table> </td> 
         </tr> 
       </table> 
       <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;"> 
         <tr style="border-collapse:collapse;"> 
          <td align="center" style="padding:0;Margin:0;"> 
           <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;"> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="Margin:0;padding-top:20px;padding-left:20px;padding-right:20px;padding-bottom:30px;"> 
               <table cellspacing="0" cellpadding="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="560" align="left" style="padding:0;Margin:0;"> 
                   <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;background-color:#FEF9EF;border-color:#EFEFEF;border-width:1px 0px 1px 1px;border-style:solid;" width="100%" cellspacing="0" cellpadding="0" bgcolor="#fef9ef"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="Margin:0;padding-bottom:10px;padding-top:20px;padding-left:20px;padding-right:20px;"> <h4 style="Margin:0;line-height:120%;mso-line-height-rule:exactly;font-family:'trebuchet ms', helvetica, sans-serif;">SUMMARY:</h4> </td> 
                     </tr> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="padding:0;Margin:0;padding-bottom:20px;padding-left:20px;padding-right:20px;"> 
                       <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;" class="cke_show_border" cellspacing="1" cellpadding="1" border="0" align="left"> 
                         <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">Buyer #:</td> 
                          <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">${bookingItem.buyer._id}</td> 
                         </tr> 
                         <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">Full Name:</td> 
                          <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">${bookingItem.buyer.firstname} ${bookingItem.buyer.lastname}</td> 
                         </tr> 
                       </table><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;"><br></p> </td> 
                     </tr> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="padding:0;Margin:0;padding-bottom:20px;padding-left:20px;padding-right:20px;"> 
                       <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;" class="cke_show_border" cellspacing="1" cellpadding="1" border="0" align="left"> 
                         <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">Booking #:</td> 
                          <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">${bookingItem._id}</td> 
                         </tr> 
                         <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">Booking Date:</td> 
                          <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">${bookingItem.createdAt}</td> 
                         </tr> 
                         <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">Total:</td> 
                          <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">$ ${amount.total}</td> 
                         </tr> 
                       </table><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;"><br></p> </td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> </td> 
             </tr> 
           </table> </td> 
         </tr> 
       </table> 
       <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;"> 
         <tr style="border-collapse:collapse;"> 
          <td align="center" style="padding:0;Margin:0;"> 
           <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;"> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:20px;padding-right:20px;"> 
               <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="270" valign="top"><![endif]--> 
               <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td class="es-m-p0r es-m-p20b" width="270" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="padding:0;Margin:0;padding-left:20px;"> <h4 style="Margin:0;line-height:120%;mso-line-height-rule:exactly;font-family:'trebuchet ms', helvetica, sans-serif;">ITEMS BOOKED</h4> </td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> 
               <!--[if mso]></td><td width="20"></td><td width="270" valign="top"><![endif]--> 
               <table cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="270" align="left" style="padding:0;Margin:0;"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="padding:0;Margin:0;"> 
                       <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;" class="cke_show_border" cellspacing="1" cellpadding="1" border="0"> 
                         <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0;"><span style="font-size:13px;">NAME</span></td> 
                          <td style="padding:0;Margin:0;text-align:center;" width="60"><span style="font-size:13px;"><span style="line-height:100%;">QTY</span></span> </td> 
                          <td style="padding:0;Margin:0;text-align:center;" width="100"><span style="font-size:13px;"><span style="line-height:100%;">PRICE</span></span> </td> 
                         </tr> 
                       </table> </td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> 
               <!--[if mso]></td></tr></table><![endif]--> </td> 
             </tr> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;"> 
               <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="560" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="center" style="padding:0;Margin:0;padding-bottom:10px;"> 
                       <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0px;border-bottom:1px solid #EFEFEF;background:rgba(0, 0, 0, 0) none repeat scroll 0% 0%;height:1px;width:100%;margin:0px;"></td> 
                         </tr> 
                       </table> </td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> </td> 
             </tr> 
             ${bookingItemHtml}
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="Margin:0;padding-top:5px;padding-left:20px;padding-bottom:30px;padding-right:40px;"> 
               <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="540" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="right" style="padding:0;Margin:0;"> 
                       <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:500px;" class="cke_show_border" cellspacing="1" cellpadding="1" border="0" align="right"> 
                         <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0;text-align:right;font-size:18px;line-height:27px;"><strong>Total:</strong></td> 
                          <td style="padding:0;Margin:0;text-align:right;font-size:18px;line-height:27px;color:#D48344;"><strong>$ ${amount.total}</strong></td> 
                         </tr> 
                       </table><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;"><br></p> </td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> </td> 
             </tr> 
           </table> </td> 
         </tr> 
       </table> </td> 
     </tr> 
   </table> 
  </div>  
 </body>
</html>

      `,
    };

    try {
      await sendEmail(msg);
    } catch (error1) {
      console.log(error1);
    }

    try {
      await Booking.findByIdAndUpdate(bookingItem._id, { status: true });
    } catch (error1) {
      console.log(error1);
    }

    const email_sender_booking = payment.payer.payer_info.email;
    const email_receiver_booking = transactionitem.payee.email;
    const price = transactionitem.amount.total;

    const newPaymentBooking = new Payment(
      {
        email_receiver: email_receiver_booking,
        email_sender: email_sender_booking,
        type: 'BOOKING',
        price,
        paymentID: paymentId,
      },
    );

    try {
      await newPaymentBooking.save();
    } catch (error1) {
      console.log(error1);
    }

    const email_sender_pay = email_receiver_booking;

    const itemsBookingPartner = await getItemBookingOwnPartner(paymentId);

    const itemsSend = [];
    for (let i = 0; i < itemsBookingPartner.length; i += 1) {
      const itemsBooking = itemsBookingPartner[i];

      const totel_price = itemsBooking.items
        .reduce((total, item) => total + item.price * item.quantity, 0);

      itemsSend.push(
        {
          recipient_type: 'EMAIL',
          amount: {
            value: totel_price * 0.9,
            currency: 'USD',
          },
          receiver: itemsBooking.email_paypal,
          note: 'This amount has been deducted 10%!',
          sender_item_id: 'item_3',
        },
      );
    }

    const sender_batch_id = Math.random().toString(36).substring(9);

    const create_payout_json = {
      sender_batch_header: {
        sender_batch_id,
        email_subject: 'You have a new booking.',
      },
      items: [
        ...itemsSend,
      ],
    };

    const sync_mode = 'false';

    paypal.payout.create(create_payout_json, sync_mode, async (error1, payout) => {
      if (error1) {
        console.log(error1.response);
      } else {
        for (let i = 0; i < itemsBookingPartner.length; i += 1) {
          const itemsBooking = itemsBookingPartner[i];
          const totel_price = itemsBooking.items
            .reduce((total, item) => total + item.price * item.quantity, 0);

          const newPaymentPay = new Payment(
            {
              email_receiver: itemsBooking.email_paypal,
              email_sender: email_sender_pay,
              type: 'PAY',
              price: totel_price * 0.9,
              paymentID: paymentId,
            },
          );

          try {
            // eslint-disable-next-line no-await-in-loop
            await newPaymentPay.save();

            const bookingItemPartnerHtml = itemsBooking.items.reduce((result, item) => {
              const itemHtml = `<tr style="border-collapse:collapse;"> 
              <td align="left" style="Margin:0;padding-top:5px;padding-bottom:10px;padding-left:20px;padding-right:20px;"> 
               <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="178" valign="top"><![endif]--> 
               <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td class="es-m-p0r es-m-p20b" width="178" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="center" style="padding:0;Margin:0;"> <img src="https://mixmap.travelerwp.com/wp-content/uploads/2017/06/TheCommonWanderer_-870x555.jpg" alt="Natural Balance L.I.D., sale 30%" class="adapt-img" title="Natural Balance L.I.D., sale 30%" width="125" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;"></td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> 
               <!--[if mso]></td><td width="20"></td><td width="362" valign="top"><![endif]--> 
               <table cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="362" align="left" style="padding:0;Margin:0;"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="padding:0;Margin:0;"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;"><br></p> 
                       <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;" class="cke_show_border" cellspacing="1" cellpadding="1" border="0"> 
                         <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0;">${item.name}</td> 
                          <td style="padding:0;Margin:0;text-align:center;" width="60">${item.quantity}</td> 
                          <td style="padding:0;Margin:0;text-align:center;" width="100">$ ${item.price}</td> 
                         </tr> 
                       </table><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;"><br></p> </td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> 
               <!--[if mso]></td></tr></table><![endif]--> </td> 
             </tr> `;

              const spaceHtml = `
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;"> 
                <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                  <tr style="border-collapse:collapse;"> 
                  <td width="560" valign="top" align="center" style="padding:0;Margin:0;"> 
                    <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                      <tr style="border-collapse:collapse;"> 
                      <td align="center" style="padding:0;Margin:0;padding-bottom:10px;"> 
                        <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                          <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0px;border-bottom:1px solid #EFEFEF;background:rgba(0, 0, 0, 0) none repeat scroll 0% 0%;height:1px;width:100%;margin:0px;"></td> 
                          </tr> 
                        </table> </td> 
                      </tr> 
                    </table> </td> 
                  </tr> 
                </table> </td> 
              </tr> 
             `;
              return result + itemHtml + spaceHtml;
            }, '');

            let partner = null;
            try {
              // eslint-disable-next-line no-await-in-loop
              partner = await Profile.findOne({ email_paypal: itemsBooking.email_paypal });
            } catch (error4) {
              console.log(error4);
              partner = null;
            }

            const msgPartner = {
              to: partner.email,
              from: 'support@didauday.me',
              subject: 'Payment Notification',
              text: 'Hi, You have a new booking!',
              html: `
              
              <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;">
         <head> 
          <meta charset="UTF-8"> 
          <meta content="width=device-width, initial-scale=1" name="viewport"> 
          <meta name="x-apple-disable-message-reformatting"> 
          <meta http-equiv="X-UA-Compatible" content="IE=edge"> 
          <meta content="telephone=no" name="format-detection"> 
          <title>booking info ngquangan</title> 
          <!--[if (mso 16)]>
            <style type="text/css">
            a {text-decoration: none;}
            </style>
            <![endif]--> 
          <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> 
          <style type="text/css">
        @media only screen and (max-width:600px) {p, ul li, ol li, a { font-size:16px!important; line-height:150%!important } h1 { font-size:30px!important; text-align:center; line-height:120%!important } h2 { font-size:26px!important; text-align:center; line-height:120%!important } h3 { font-size:20px!important; text-align:center; line-height:120%!important } h1 a { font-size:30px!important } h2 a { font-size:26px!important } h3 a { font-size:20px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:16px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:block!important } a.es-button { font-size:20px!important; display:block!important; border-left-width:0px!important; border-right-width:0px!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } .es-desk-menu-hidden { display:table-cell!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-menu td a { font-size:16px!important } }
        #outlook a {
          padding:0;
        }
        .ExternalClass {
          width:100%;
        }
        .ExternalClass,
        .ExternalClass p,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
          line-height:100%;
        }
        .es-button {
          mso-style-priority:100!important;
          text-decoration:none!important;
        }
        a[x-apple-data-detectors] {
          color:inherit!important;
          text-decoration:none!important;
          font-size:inherit!important;
          font-family:inherit!important;
          font-weight:inherit!important;
          line-height:inherit!important;
        }
        .es-desk-hidden {
          display:none;
          float:left;
          overflow:hidden;
          width:0;
          max-height:0;
          line-height:0;
          mso-hide:all;
        }
        </style> 
         </head> 
         <body style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;"> 
          <div class="es-wrapper-color" style="background-color:#EFEFEF;"> 
           <!--[if gte mso 9]>
              <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                <v:fill type="tile" color="#efefef"></v:fill>
              </v:background>
            <![endif]--> 
           <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;"> 
             <tr style="border-collapse:collapse;"> 
              <td valign="top" style="padding:0;Margin:0;"> 
               <table class="es-header" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td align="center" style="padding:0;Margin:0;"> 
                   <table class="es-header-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FEF5E4;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:15px;padding-right:15px;"> 
                       <!--[if mso]><table width="570" cellpadding="0" cellspacing="0"><tr><td width="180" valign="top"><![endif]--> 
                       <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td class="es-m-p0r" width="180" valign="top" align="center" style="padding:0;Margin:0;"> 
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                             <tr style="border-collapse:collapse;"> 
                              <td align="center" style="padding:0;Margin:0;display:none;"></td> 
                             </tr> 
                           </table> </td> 
                         </tr> 
                       </table> 
                       <!--[if mso]></td><td width="20"></td><td width="370" valign="top"><![endif]--> 
                       <table cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td width="370" align="left" style="padding:0;Margin:0;"> 
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                             <tr style="border-collapse:collapse;"> 
                              <td align="center" style="padding:0;Margin:0;display:none;"></td> 
                             </tr> 
                           </table> </td> 
                         </tr> 
                       </table> 
                       <!--[if mso]></td></tr></table><![endif]--> </td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> 
               <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td align="center" style="padding:0;Margin:0;"> 
                   <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:20px;padding-right:20px;"> 
                       <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td width="560" valign="top" align="center" style="padding:0;Margin:0;"> 
                           <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:0px;" width="100%" cellspacing="0" cellpadding="0"> 
                             <tr style="border-collapse:collapse;"> 
                              <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:15px;"> <h1 style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:'trebuchet ms', helvetica, sans-serif;font-size:30px;font-style:normal;font-weight:normal;color:#333333;">You have a new booking!</h1> </td> 
                             </tr> 
                           </table> </td> 
                         </tr> 
                       </table> </td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> 
               <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td align="center" style="padding:0;Margin:0;"> 
                   <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="Margin:0;padding-top:20px;padding-left:20px;padding-right:20px;padding-bottom:30px;"> 
                       <table cellspacing="0" cellpadding="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td width="560" align="left" style="padding:0;Margin:0;"> 
                           <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;background-color:#FEF9EF;border-color:#EFEFEF;border-width:1px 0px 1px 1px;border-style:solid;" width="100%" cellspacing="0" cellpadding="0" bgcolor="#fef9ef"> 
                             <tr style="border-collapse:collapse;"> 
                              <td align="left" style="Margin:0;padding-bottom:10px;padding-top:20px;padding-left:20px;padding-right:20px;"> <h4 style="Margin:0;line-height:120%;mso-line-height-rule:exactly;font-family:'trebuchet ms', helvetica, sans-serif;">SUMMARY:</h4> </td> 
                             </tr> 
                             <tr style="border-collapse:collapse;"> 
                              <td align="left" style="padding:0;Margin:0;padding-bottom:20px;padding-left:20px;padding-right:20px;"> 
                               <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;" class="cke_show_border" cellspacing="1" cellpadding="1" border="0" align="left"> 
                                 <tr style="border-collapse:collapse;"> 
                                  <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">Buyer #:</td> 
                                  <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">${bookingItem.buyer._id}</td> 
                                 </tr> 
                                 <tr style="border-collapse:collapse;"> 
                                  <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">Full Name:</td> 
                                  <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">${bookingItem.buyer.firstname} ${bookingItem.buyer.lastname}</td> 
                                 </tr> 
                               </table><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;"><br></p> </td> 
                             </tr> 
                             <tr style="border-collapse:collapse;"> 
                              <td align="left" style="padding:0;Margin:0;padding-bottom:20px;padding-left:20px;padding-right:20px;"> 
                               <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;" class="cke_show_border" cellspacing="1" cellpadding="1" border="0" align="left"> 
                                 <tr style="border-collapse:collapse;"> 
                                  <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">Booking #:</td> 
                                  <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">${bookingItem._id}</td> 
                                 </tr> 
                                 <tr style="border-collapse:collapse;"> 
                                  <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">Booking Date:</td> 
                                  <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">${bookingItem.createdAt}</td> 
                                 </tr> 
                                 <tr style="border-collapse:collapse;"> 
                                  <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">Total:</td> 
                                  <td style="padding:0;Margin:0;font-size:14px;line-height:21px;">$ ${totel_price * 0.9}</td> 
                                 </tr> 
                               </table><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;"><br></p> </td> 
                             </tr> 
                           </table> </td> 
                         </tr> 
                       </table> </td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> 
               <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td align="center" style="padding:0;Margin:0;"> 
                   <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:20px;padding-right:20px;"> 
                       <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="270" valign="top"><![endif]--> 
                       <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td class="es-m-p0r es-m-p20b" width="270" valign="top" align="center" style="padding:0;Margin:0;"> 
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                             <tr style="border-collapse:collapse;"> 
                              <td align="left" style="padding:0;Margin:0;padding-left:20px;"> <h4 style="Margin:0;line-height:120%;mso-line-height-rule:exactly;font-family:'trebuchet ms', helvetica, sans-serif;">ITEMS BOOKED</h4> </td> 
                             </tr> 
                           </table> </td> 
                         </tr> 
                       </table> 
                       <!--[if mso]></td><td width="20"></td><td width="270" valign="top"><![endif]--> 
                       <table cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td width="270" align="left" style="padding:0;Margin:0;"> 
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                             <tr style="border-collapse:collapse;"> 
                              <td align="left" style="padding:0;Margin:0;"> 
                               <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;" class="cke_show_border" cellspacing="1" cellpadding="1" border="0"> 
                                 <tr style="border-collapse:collapse;"> 
                                  <td style="padding:0;Margin:0;"><span style="font-size:13px;">NAME</span></td> 
                                  <td style="padding:0;Margin:0;text-align:center;" width="60"><span style="font-size:13px;"><span style="line-height:100%;">QTY</span></span> </td> 
                                  <td style="padding:0;Margin:0;text-align:center;" width="100"><span style="font-size:13px;"><span style="line-height:100%;">PRICE</span></span> </td> 
                                 </tr> 
                               </table> </td> 
                             </tr> 
                           </table> </td> 
                         </tr> 
                       </table> 
                       <!--[if mso]></td></tr></table><![endif]--> </td> 
                     </tr> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;"> 
                       <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td width="560" valign="top" align="center" style="padding:0;Margin:0;"> 
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                             <tr style="border-collapse:collapse;"> 
                              <td align="center" style="padding:0;Margin:0;padding-bottom:10px;"> 
                               <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                                 <tr style="border-collapse:collapse;"> 
                                  <td style="padding:0;Margin:0px;border-bottom:1px solid #EFEFEF;background:rgba(0, 0, 0, 0) none repeat scroll 0% 0%;height:1px;width:100%;margin:0px;"></td> 
                                 </tr> 
                               </table> </td> 
                             </tr> 
                           </table> </td> 
                         </tr> 
                       </table> </td> 
                     </tr> 
                     ${bookingItemPartnerHtml}
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="Margin:0;padding-top:5px;padding-left:20px;padding-bottom:30px;padding-right:40px;"> 
                       <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td width="540" valign="top" align="center" style="padding:0;Margin:0;"> 
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                             <tr style="border-collapse:collapse;"> 
                              <td align="right" style="padding:0;Margin:0;"> 
                               <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:500px;" class="cke_show_border" cellspacing="1" cellpadding="1" border="0" align="right"> 
                                 <tr style="border-collapse:collapse;"> 
                                  <td style="padding:0;Margin:0;text-align:right;font-size:14px;line-height:27px;">Deduction:</td> 
                                  <td style="padding:0;Margin:0;text-align:right;font-size:14px;line-height:27px;color:#D48344;"><strong>${10}%</strong></td> 
                                 </tr> 
                               </table><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;"><br></p> </td> 
                             </tr> 
                           </table> </td> 
                         </tr> 
                       </table> </td> 
                     </tr> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="left" style="Margin:0;padding-top:5px;padding-left:20px;padding-bottom:30px;padding-right:40px;"> 
                       <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td width="540" valign="top" align="center" style="padding:0;Margin:0;"> 
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                             <tr style="border-collapse:collapse;"> 
                              <td align="right" style="padding:0;Margin:0;"> 
                               <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:500px;" class="cke_show_border" cellspacing="1" cellpadding="1" border="0" align="right"> 
                                 <tr style="border-collapse:collapse;"> 
                                  <td style="padding:0;Margin:0;text-align:right;font-size:18px;line-height:27px;"><strong>Total:</strong></td> 
                                  <td style="padding:0;Margin:0;text-align:right;font-size:18px;line-height:27px;color:#D48344;"><strong>$ ${totel_price * 0.9}</strong></td> 
                                 </tr> 
                               </table><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;"><br></p> </td> 
                             </tr> 
                           </table> </td> 
                         </tr> 
                       </table> </td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> </td> 
             </tr> 
           </table> 
          </div>  
         </body>
        </html>
        
              `,
            };

            if (partner) {
              try {
                // eslint-disable-next-line no-await-in-loop
                await sendEmail(msgPartner);
              } catch (error3) {
                console.log(error3);
              }
            }
          } catch (error2) {
            console.log(error2);
          }
        }
      }
    });

    return res.redirect(process.env.URL_REDIRECT_BOOKING_SUCCESS);
  });
};

const bookCancel = async (req, res) => {
  const { token } = req.query;
  console.log(token);
  try {
    await Booking.findOneAndUpdate({ token_paypal: token }, { is_choose: false });
  } catch (error) {
    console.log(error);
  }

  let booking = null;
  try {
    booking = await Booking.aggregate([
      {
        $match: {
          token_paypal: token,
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


    ]);
  } catch (error) {
    console.log(error);
  }

  if (booking.length > 0) {
    const [bookingItem] = booking;
    const { tour, quantity } = bookingItem.booking_item;

    let tourItem = null;
    try {
      tourItem = await Tour.findById(tour);
    } catch (error) {
      console.log(error);
    }

    if (tourItem) {
      const available = tourItem.available + quantity;
      try {
        tourItem = await Tour.findByIdAndUpdate(tourItem._id, { available });
      } catch (error) {
        console.log(error);
      }
    }
  }

  return res.redirect(process.env.URL_REDIRECT_BOOKING_FAILED);
};

module.exports = {
  getAllBookings,
  bookItem,
  bookSuccess,
  bookCancel,
  getAllBookingsOwnMember,
  getAllBookingsOwnPartner,
};
