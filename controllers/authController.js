const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Account = require('../models/Account');
const Profile = require('../models/Profile');

const validateAuth = require('../validations/auth');

const validateLoginInput = validateAuth.login;
const validateRegisterInput = validateAuth.register;
const validateResetPasswordInput = validateAuth.resetPassword;
const validateCreatePasswordInput = validateAuth.createPassword;
const validateChangePasswordInput = validateAuth.changePassword;

const sendEmail = require('../helpers/sendEmail');

const login = async (req, res) => {
  const {
    errors,
    isValid,
  } = validateLoginInput(req.body);
  const {
    email,
    password,
  } = req.body;

  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let account = null;
  try {
    account = await Account.findOne({
      email,
      type: {
        $eq: 'email',
      },
    });
  } catch (error) {
    console.log(error);
    account = null;
  }

  if (!account) {
    errors.error = 'This account is not exists.';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let isMatch = null;
  try {
    isMatch = await bcrypt.compare(password, account.password);
  } catch (error) {
    console.log(error);
    isMatch = null;
  }

  if (!isMatch) {
    errors.error = 'Email or password is invaild';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  if (!account.is_confirm) {
    errors.error = 'This account has not been confirmed';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const jwtPayload = {
    email,
    _id: account._id,
  };

  const expiresIn = '1d';

  jwt.sign(jwtPayload, process.env.JWT_SECRET_KEY, {
    expiresIn,
  }, async (err, token) => {
    if (err) {
      console.log(err);
      errors.error = 'Can\'t not login. Please try again';
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    try {
      await Account.findByIdAndUpdate(account._id, { token, is_exp: false });
    } catch (error) {
      console.log(error);
      errors.errors = 'Can\'t login. Please try again!';
      return res.status(400).json({
        success: true,
        errors,
      });
    }

    let userInfo = null;
    try {
      userInfo = await Profile.findById(account.profile);
    } catch (error) {
      console.log(error);
      userInfo = null;
    }

    if (!userInfo) {
      errors.errors = 'Can\'t login. Please try again!';
      return res.status(400).json({
        success: true,
        errors,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        token,
        userInfo,
        expiresIn,
      },
    });
  });
};

const register = async (req, res) => {
  const {
    errors,
    isValid,
  } = validateRegisterInput(req.body);
  const {
    email,
    password,
    role,
    firstname,
    lastname,
  } = req.body;
  if (!isValid) {
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  let checkUser = null;
  try {
    checkUser = await Account.findOne({
      email,
    });
  } catch (error) {
    console.log(error);
    checkUser = null;
  }

  if (checkUser) {
    errors.email = 'Email already exists';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  let hashedPassword = null;
  try {
    hashedPassword = await bcrypt.hash(password, 13);
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t create new account. Please try again';
  }

  if (!hashedPassword) {
    errors.error = 'Don\'t create account';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  const confirmToken = jwt.sign(
    {
      email,
    },
    process.env.JWT_SECRET_KEY,
  );

  const newProfile = new Profile({
    firstname,
    lastname,
    email,
    role,
  });

  const newAccount = new Account({
    email,
    password: hashedPassword,
    role,
    confirm_token: confirmToken,
    profile: newProfile,
  });

  let userCreated = null;
  try {
    userCreated = await Promise.all([newProfile.save(), newAccount.save()]);
  } catch (error) {
    try {
      await Profile.findByIdAndDelete(newProfile._id);
    } catch (error1) {
      console.log(error1);
    }
    console.log(error);
  }

  if (!userCreated) {
    errors.error = 'Don\'t create account';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  const msg = {
    to: email,
    from: 'support@didauday.me',
    subject: 'Confirm account',
    text: `Please confirm your account at <a href ="http://${process.env.HOST}/auth/confirm-email/${confirmToken}">here</a>`,
    html: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html style="width:100%;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;">
 <head> 
  <meta charset="UTF-8"> 
  <meta content="width=device-width, initial-scale=1" name="viewport"> 
  <meta name="x-apple-disable-message-reformatting"> 
  <meta http-equiv="X-UA-Compatible" content="IE=edge"> 
  <meta content="telephone=no" name="format-detection"> 
  <title>confirm account ngquangan</title> 
  <!--[if (mso 16)]>
    <style type="text/css">
    a {text-decoration: none;}
    </style>
    <![endif]--> 
  <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> 
  <!--[if !mso]><!-- --> 
  <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"> 
  <!--<![endif]--> 
  <style type="text/css">
@media only screen and (max-width:600px) {p, ul li, ol li, a { font-size:16px!important; line-height:150%!important } h1 { font-size:30px!important; text-align:center; line-height:120%!important } h2 { font-size:26px!important; text-align:center; line-height:120%!important } h3 { font-size:20px!important; text-align:center; line-height:120%!important } h1 a { font-size:30px!important } h2 a { font-size:26px!important } h3 a { font-size:20px!important } .es-menu td a { font-size:16px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:16px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:block!important } a.es-button { font-size:20px!important; display:block!important; border-width:15px 25px 15px 25px!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } .es-desk-menu-hidden { display:table-cell!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } }
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
 <body style="width:100%;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;"> 
  <div class="es-wrapper-color" style="background-color:#F4F4F4;"> 
   <!--[if gte mso 9]>
			<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
				<v:fill type="tile" color="#f4f4f4"></v:fill>
			</v:background>
		<![endif]--> 
   <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;"> 
     <tr class="gmail-fix" height="0" style="border-collapse:collapse;"> 
      <td style="padding:0;Margin:0;"> 
       <table width="600" cellspacing="0" cellpadding="0" border="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
         <tr style="border-collapse:collapse;"> 
          <td cellpadding="0" cellspacing="0" border="0" style="padding:0;Margin:0;line-height:1px;min-width:600px;" height="0"> <img src="https://esputnik.com/repository/applications/images/blank.gif" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;max-height:0px;min-height:0px;min-width:600px;width:600px;" alt="" width="600" height="1"> </td> 
         </tr> 
       </table> </td> 
     </tr> 
     <tr style="border-collapse:collapse;"> 
      <td valign="top" style="padding:0;Margin:0;"> 
       <table class="es-header" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:#FFA73B;background-repeat:repeat;background-position:center top;"> 
         <tr style="border-collapse:collapse;"> 
          <td align="center" style="padding:0;Margin:0;"> 
           <table class="es-header-body" width="600" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;"> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="Margin:0;padding-bottom:10px;padding-left:10px;padding-right:10px;padding-top:20px;"> 
               <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="580" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="center" style="Margin:0;padding-left:10px;padding-right:10px;padding-top:25px;padding-bottom:25px;"> <img src="https://wbhtq.stripocdn.email/content/guids/CABINET_3df254a10a99df5e44cb27b842c2c69e/images/7331519201751184.png" alt="" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" width="40"></td> 
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
          <td style="padding:0;Margin:0;background-color:#FFA73B;" bgcolor="#ffa73b" align="center"> 
           <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;" width="600" cellspacing="0" cellpadding="0" align="center"> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="padding:0;Margin:0;"> 
               <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="600" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;background-color:#FFFFFF;border-radius:4px;" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="center" style="Margin:0;padding-bottom:5px;padding-left:30px;padding-right:30px;padding-top:35px;"> <h1 style="Margin:0;line-height:58px;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;font-size:48px;font-style:normal;font-weight:normal;color:#111111;">Xin chào!</h1> </td> 
                     </tr> 
                     <tr style="border-collapse:collapse;"> 
                      <td bgcolor="#ffffff" align="center" style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:20px;padding-right:20px;"> 
                       <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0px;border-bottom:1px solid #FFFFFF;background:rgba(0, 0, 0, 0) none repeat scroll 0% 0%;height:1px;width:100%;margin:0px;"></td> 
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
       <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;"> 
         <tr style="border-collapse:collapse;"> 
          <td align="center" style="padding:0;Margin:0;"> 
           <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;" width="600" cellspacing="0" cellpadding="0" align="center"> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="padding:0;Margin:0;"> 
               <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="600" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:4px;background-color:#FFFFFF;" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff"> 
                     <tr style="border-collapse:collapse;"> 
                      <td class="es-m-txt-l" bgcolor="#ffffff" align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:30px;padding-right:30px;"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:18px;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:27px;color:#666666;">Cám ơn bạn đã đăng ký tài khoản ở didauday.me. Đầu tiên, bạn cần xác thực tài khoản của mình.</p> </td> 
                     </tr> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="center" style="Margin:0;padding-left:10px;padding-right:10px;padding-top:35px;padding-bottom:35px;"> <span class="es-button-border" style="border-style:solid;border-color:#FFA73B;background:1px;border-width:1px;display:inline-block;border-radius:2px;width:auto;"> <a href="http://${process.env.HOST}/auth/confirm-email/${confirmToken}" class="es-button" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:20px;color:#FFFFFF;border-style:solid;border-color:#FFA73B;border-width:15px 30px;display:inline-block;background:#FFA73B;border-radius:2px;font-weight:normal;font-style:normal;line-height:24px;width:auto;text-align:center;">Xác nhận tài khoản</a> </span> </td> 
                     </tr> 
                     <tr style="border-collapse:collapse;"> 
                      <td class="es-m-txt-l" align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:30px;padding-right:30px;"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:18px;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:27px;color:#666666;">Nếu nó không hoạt động bạn hãy sao chép đường link dưới đây và dán nó vào thanh địa chỉ trên trình duyệt.</p> </td> 
                     </tr> 
                     <tr style="border-collapse:collapse;"> 
                      <td class="es-m-txt-l" align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:30px;padding-right:30px;"> <a target="_blank" href="http://${process.env.HOST}/auth/confirm-email/${confirmToken}" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;font-size:18px;text-decoration:underline;color:#FFA73B;">http://${process.env.HOST}/auth/confirm-email/${confirmToken}</a></td> 
                     </tr> 
                     <tr style="border-collapse:collapse;"> 
                      <td class="es-m-txt-l" align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:30px;padding-right:30px;"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:18px;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:27px;color:#666666;"><br></p> </td> 
                     </tr> 
                     <tr style="border-collapse:collapse;"> 
                      <td class="es-m-txt-l" align="left" style="Margin:0;padding-top:20px;padding-left:30px;padding-right:30px;padding-bottom:40px;"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:18px;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:27px;color:#666666;">An</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:18px;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:27px;color:#666666;">support@didauday.me</p> </td> 
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
           <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;" width="600" cellspacing="0" cellpadding="0" align="center"> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="padding:0;Margin:0;"> 
               <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="600" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="center" style="Margin:0;padding-top:10px;padding-bottom:20px;padding-left:20px;padding-right:20px;"> 
                       <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0px;border-bottom:1px solid #F4F4F4;background:rgba(0, 0, 0, 0) none repeat scroll 0% 0%;height:1px;width:100%;margin:0px;"></td> 
                         </tr> 
                       </table> </td> 
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

  if (!sendEmail(msg)) {
    try {
      await Profile.findByIdAndDelete(newProfile._id);
      await Account.findByIdAndDelete(newAccount._id);
    } catch (error1) {
      console.log(error1);
    }
    errors.error = 'Don\'t create account';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  return res.status(200).json({
    success: true,
    data: {
      user: userCreated[0],
    },
  });
};

const checkAuth = async (req, res) => {
  return res.status(200).json({
    success: true,
  });
};

const confirmAccount = async (req, res) => {
  const token = req.params.confirmToken;

  let account = null;
  try {
    account = await Account.findOne({
      confirm_token: token,
    });
  } catch (error) {
    console.log(error);
    return res.redirect(process.env.URL_CONFIRM_FAILED);
  }

  if (!account) {
    return res.redirect(process.env.URL_CONFIRM_FAILED);
  }

  if (account.is_confirm) {
    return res.redirect(process.env.URL_CONFIRM_FAILED);
  }

  account.is_confirm = true;
  try {
    await account.save();
  } catch (error) {
    console.log(error);
    return res.redirect(process.env.URL_CONFIRM_FAILED);
  }

  console.log(account)
  return res.redirect(process.env.URL_CONFIRM_SUCCESS);
};

const resetPassword = async (req, res) => {
  const {
    errors,
    isValid,
  } = validateResetPasswordInput(req.body);
  const {
    email,
  } = req.body;

  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let account = null;
  try {
    account = await Account.findOne({
      email,
    });
  } catch (error) {
    console.log(error);
  }

  if (!account) {
    errors.error = 'Don\'t find account with this email';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  const resetToken = jwt.sign(
    {
      email,
    },
    process.env.JWT_SECRET_KEY,
  );

  const msg = {
    to: email,
    from: 'support@didauday.me',
    subject: 'Reset password',
    text: `Reset password for your account at <a href ="http://${process.env.HOST}/auth/reset-password/${resetToken}">here</a>`,
    html: `
    
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html style="width:100%;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;">
 <head> 
  <meta charset="UTF-8"> 
  <meta content="width=device-width, initial-scale=1" name="viewport"> 
  <meta name="x-apple-disable-message-reformatting"> 
  <meta http-equiv="X-UA-Compatible" content="IE=edge"> 
  <meta content="telephone=no" name="format-detection"> 
  <title>reset password ngquangan</title> 
  <!--[if (mso 16)]>
    <style type="text/css">
    a {text-decoration: none;}
    </style>
    <![endif]--> 
  <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> 
  <!--[if !mso]><!-- --> 
  <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"> 
  <!--<![endif]--> 
  <style type="text/css">
@media only screen and (max-width:600px) {p, ul li, ol li, a { font-size:16px!important; line-height:150%!important } h1 { font-size:30px!important; text-align:center; line-height:120%!important } h2 { font-size:26px!important; text-align:center; line-height:120%!important } h3 { font-size:20px!important; text-align:center; line-height:120%!important } h1 a { font-size:30px!important } h2 a { font-size:26px!important } h3 a { font-size:20px!important } .es-menu td a { font-size:16px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:16px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:block!important } a.es-button { font-size:20px!important; display:block!important; border-width:15px 25px 15px 25px!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } .es-desk-menu-hidden { display:table-cell!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } }
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
 <body style="width:100%;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;"> 
  <div class="es-wrapper-color" style="background-color:#F4F4F4;"> 
   <!--[if gte mso 9]>
			<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
				<v:fill type="tile" color="#f4f4f4"></v:fill>
			</v:background>
		<![endif]--> 
   <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;"> 
     <tr class="gmail-fix" height="0" style="border-collapse:collapse;"> 
      <td style="padding:0;Margin:0;"> 
       <table width="600" cellspacing="0" cellpadding="0" border="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
         <tr style="border-collapse:collapse;"> 
          <td cellpadding="0" cellspacing="0" border="0" style="padding:0;Margin:0;line-height:1px;min-width:600px;" height="0"> <img src="https://esputnik.com/repository/applications/images/blank.gif" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;max-height:0px;min-height:0px;min-width:600px;width:600px;" alt="" width="600" height="1"> </td> 
         </tr> 
       </table> </td> 
     </tr> 
     <tr style="border-collapse:collapse;"> 
      <td valign="top" style="padding:0;Margin:0;"> 
       <table class="es-header" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:#7C72DC;background-repeat:repeat;background-position:center top;"> 
         <tr style="border-collapse:collapse;"> 
          <td style="padding:0;Margin:0;background-color:#7C72DC;" bgcolor="#7c72dc" align="center"> 
           <table class="es-header-body" width="600" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#7C72DC;"> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="Margin:0;padding-bottom:10px;padding-left:10px;padding-right:10px;padding-top:20px;"> 
               <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="580" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="center" style="Margin:0;padding-left:10px;padding-right:10px;padding-top:25px;padding-bottom:25px;"> <img src="https://wbhtq.stripocdn.email/content/guids/CABINET_3df254a10a99df5e44cb27b842c2c69e/images/7331519201751184.png" alt="" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" width="40"></td> 
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
          <td style="padding:0;Margin:0;background-color:#7C72DC;" bgcolor="#7c72dc" align="center"> 
           <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;" width="600" cellspacing="0" cellpadding="0" align="center"> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="padding:0;Margin:0;"> 
               <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="600" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;background-color:#FFFFFF;border-radius:4px;" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="center" style="Margin:0;padding-bottom:5px;padding-left:30px;padding-right:30px;padding-top:35px;"> <h1 style="Margin:0;line-height:58px;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;font-size:48px;font-style:normal;font-weight:normal;color:#111111;">Bạn đã quên mật khẩu?</h1> </td> 
                     </tr> 
                     <tr style="border-collapse:collapse;"> 
                      <td bgcolor="#ffffff" align="center" style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:20px;padding-right:20px;"> 
                       <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                         <tr style="border-collapse:collapse;"> 
                          <td style="padding:0;Margin:0px;border-bottom:1px solid #FFFFFF;background:rgba(0, 0, 0, 0) none repeat scroll 0% 0%;height:1px;width:100%;margin:0px;"></td> 
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
       <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;"> 
         <tr style="border-collapse:collapse;"> 
          <td align="center" style="padding:0;Margin:0;"> 
           <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="padding:0;Margin:0;"> 
               <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="600" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff"> 
                     <tr style="border-collapse:collapse;"> 
                      <td class="es-m-txt-l" bgcolor="#ffffff" align="left" style="Margin:0;padding-bottom:15px;padding-top:20px;padding-left:30px;padding-right:30px;"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:18px;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:27px;color:#666666;">Hãy nhấn vào nút phía dưới và đặt lại mật khẩu cho tài khoản của mình.</p> </td> 
                     </tr> 
                   </table> </td> 
                 </tr> 
               </table> </td> 
             </tr> 
             <tr style="border-collapse:collapse;"> 
              <td align="left" style="padding:0;Margin:0;padding-bottom:20px;padding-left:30px;padding-right:30px;"> 
               <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                 <tr style="border-collapse:collapse;"> 
                  <td width="540" valign="top" align="center" style="padding:0;Margin:0;"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> 
                     <tr style="border-collapse:collapse;"> 
                      <td align="center" style="Margin:0;padding-left:10px;padding-right:10px;padding-top:40px;padding-bottom:40px;"> <span class="es-button-border" style="border-style:solid;border-color:#7C72DC;background:#7C72DC;border-width:1px;display:inline-block;border-radius:2px;width:auto;"> <a href="http://${process.env.HOST}/auth/reset-password/${resetToken}" class="es-button" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:20px;color:#FFFFFF;border-style:solid;border-color:#7C72DC;border-width:15px 25px 15px 25px;display:inline-block;background:#7C72DC;border-radius:2px;font-weight:normal;font-style:normal;line-height:24px;width:auto;text-align:center;">Reset Password</a> </span> </td> 
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

  if (!sendEmail(msg)) {
    errors.error = 'Can\'t reset password for your account. Please try again';
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
        notify: 'Please check your email to reset password.',
      },
    },
  );
};

const getPageCreatePassword = async (req, res) => {
  const {
    resetToken,
  } = req.params;

  const payload = jwt.decode(resetToken);

  let account = null;
  try {
    account = await Account.findOne({
      email: payload.email,
    });
  } catch (error) {
    console.log(error);
    account = null;
  }

  if (!account) {
    return res.redirect(process.env.URL_RESET_PASSWORD_FAILED);
  }

  return res.redirect(process.env.URL_RESET_PASSWORD_SUCCESS);
};

const createNewPassword = async (req, res) => {
  const {
    errors,
    isValid,
  } = validateCreatePasswordInput(req.body);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const {
    password,
  } = req.body;
  const {
    resetToken,
  } = req.params;

  const payload = jwt.decode(resetToken);

  let account = null;
  try {
    account = await Account.findOne({
      email: payload.email,
    });
  } catch (error) {
    console.log(error);
    account = null;
  }

  if (!account) {
    errors.error = 'Can\'t create new password for your account. Please try again';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  let hashedPassword = null;
  try {
    hashedPassword = await bcrypt.hash(password, 13);
  } catch (error) {
    console.log(error);
    hashedPassword = null;
  }

  if (!hashedPassword) {
    errors.error = 'Can\'t create new password for your account. Please try again';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  account.password = hashedPassword;
  try {
    await account.save();
  } catch (error) {
    errors.error = 'Can\'t create new password for your account. Please try again';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  return res.status(200).json({
    success: true,
    data: {
      notify: 'Reset password successfully.',
    },
  });
};

const changePassword = async (req, res) => {
  const {
    errors,
    isValid,
  } = validateChangePasswordInput(req.body);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const {
    old_password,
    new_password,
  } = req.body;

  const userId = req.user._id;

  let account = null;
  try {
    account = await Account.findById(userId);
  } catch (error) {
    console.log(error);
    account = null;
  }

  if (!account) {
    errors.error = 'Can\'t change password. Please try again';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let isMatch = null;
  try {
    isMatch = await bcrypt.compare(old_password, account.password);
  } catch (error) {
    console.log(error);
    isMatch = null;
  }

  if (!isMatch) {
    errors.error = 'Old password not match.';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  let hashedPassword = null;
  try {
    hashedPassword = await bcrypt.hash(new_password, 13);
  } catch (error) {
    console.log(error);
    hashedPassword = null;
  }

  if (!hashedPassword) {
    errors.error = 'Can\'t change password. Please try again';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  try {
    await Account.findByIdAndUpdate(account._id, { password: hashedPassword });
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t change password. Please try again';
    return res.status(400).json(
      {
        success: false,
        errors,
      },
    );
  }

  return res.status(200).json({
    success: true,
    data: {
      notify: 'Change password successfully.',
    },
  });
};

const createAccountFromGoogle = async (req, res) => {
  const errors = {};
  const {
    email,
    given_name,
    family_name,
    picture,
  } = req.user;

  const newProfile = new Profile({
    firstname: given_name,
    lastname: family_name,
    avatar: picture,
    email,
  });

  const newAccount = new Account({
    email,
    role: 2,
    is_confirm: true,
    profile: newProfile,
    type: 'social',
  });

  let userCreated = null;
  try {
    userCreated = await Promise.all([newProfile.save(), newAccount.save()]);
  } catch (error) {
    try {
      await Profile.findByIdAndDelete(newProfile._id);
    } catch (error1) {
      console.log(error1);
    }
    console.log(error);
    errors.error = 'Can\'t create new account';
    return res.status(500).json(
      {
        success: false,
        errors,
      },
    );
  }

  if (!userCreated) {
    errors.error = 'Don\'t create account';
    return res.status(500).json(
      {
        success: false,
        errors,
      },
    );
  }

  const jwtPayload = {
    email,
    _id: newAccount._id,
  };

  jwt.sign(jwtPayload, process.env.JWT_SECRET_KEY, {
    expiresIn: '1h',
  }, (err, token) => {
    if (err) {
      console.log(err);
      errors.error = 'Can\'t not login. Please try again';
      return res.status(400).json({
        success: false,
        errors,
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        token,
      },
    });
  });
};

const loginGoogle = async (req, res) => {
  const errors = {};
  const {
    email,
  } = req.user;
  let account = null;
  try {
    account = await Account.findOne({
      email,
    });
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t not login. Please try again';
    return res.status(500).json({
      success: false,
      errors,
    });
  }
  if (!account) {
    createAccountFromGoogle(req, res);
  }
  const jwtPayload = {
    email,
    _id: account._id,
  };

  jwt.sign(jwtPayload, process.env.JWT_SECRET_KEY, {
    expiresIn: '1h',
  }, (err, token) => {
    if (err) {
      console.log(err);
      errors.error = 'Can\'t not login. Please try again';
      return res.status(500).json({
        success: false,
        errors,
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        token,
      },
    });
  });
};

const loginSocialFailed = (req, res) => res.status(400).json({
  success: false,
  data: {
    error: 'Don\'t login with social account',
  },
});

const logout = async (req, res) => {
  const errors = {};
  const userId = req.user._id;

  let account = null;

  try {
    account = await Account.findById(userId);
  } catch (error) {
    console.log(error);
    account = null;
  }

  if (!account) {
    errors.error = 'Can\'t logout. Please try again later!';
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  try {
    await Account.findByIdAndUpdate(account._id, { is_exp: true });
  } catch (error) {
    console.log(error);
    errors.error = 'Can\'t logout. Please try again later!';
    return res.status(500).json({
      success: false,
      errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      notify: 'Logout successfully.',
    },
  });
};

module.exports = {
  checkAuth,
  login,
  register,
  confirmAccount,
  resetPassword,
  getPageCreatePassword,
  createNewPassword,
  changePassword,
  loginGoogle,
  loginSocialFailed,
  logout,
};
