const express = require("express");
const router = express.Router();
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
let path = require("path");
require("dotenv").config();
const client = require("../redis");
const checkjwt = require("../utils/checkjwt");
const User = require("../Models/user.js");
const Userpost = require("../Models/userposts.js");
var nodemailer = require("nodemailer");

//s3 start here
const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION,
});

const upload = (bucketName) =>
  multer({
    storage: multerS3({
      s3,
      bucket: bucketName,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
      },
    }),
  });
//s3 end here

//<<<<<<<<<<<<===============================================>>>>>>>>>>>>>>>>>
//                      user signup and   Userprofilepic upload
//<<<<<<<<<<<<===============================================>>>>>>>>>>>>>>>>>

router.post("/signup", (req, res) => {
  const uploadSingle = upload(process.env.S3_BUCKET_NAME).single("profilepic");

  uploadSingle(req, res, async (err) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "something went wrong..." });
    //<<<<<<<<<===========================================================================================>>>>>>>>
    //                user data will be sent to database if storing pic in the server is successfull
    //<<<<<<<<<===========================================================================================>>>>>>>>
    const email = req.body.email;
    const name = req.body.name;
    const profilepic = req.file.location;
    bcrypt.hash(req.body.password, 10).then(function (hash) {
      const newuser = new User({ name, email, password: hash, profilepic });
      console.log("user details are", newuser);
      newuser.save().then((result) => {
        const userpost = new Userpost({ owner: result._id });
        userpost.save().then(() => {
          return res.json({
            success: true,
          });
        });
      });
    });
  });
});

///<<<<<<<<<===========================================================================================>>>>>>>>
///                               user login
///<<<<<<<<<===========================================================================================>>>>>>>>

router.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  await User.find({ email }).exec((err, result) => {
    if (err) {
      return res.status(400).send(err);
    }
    if (result.length > 0) {
      bcrypt.compare(password, result[0].password).then((match) => {
        if (match) {
          const Authorization = jwt.sign(
            {
              data: `8349234hchjsdshidh${email}hsxhjjdsdshadhx888`,
            },
            process.env.jwtsecret,
            { expiresIn: "2000h" }
          );

          const decodeddata = jwt.decode(Authorization);

          return res.send({
            login: true,
            user: result,
            Authorization,
          });
        } else
          return res.send({
            login: false,
          });
      });
    } else
      return res.send({
        login: false,
      });
  });
});
///<<<<<<<<<===========================================================================================>>>>>>>>
///                               user profile update
///<<<<<<<<<===========================================================================================>>>>>>>>

router.post("/update", checkjwt, async (req, res) => {
  const jwttoken = req.jwttoken;
  if (jwttoken) {
    try {
      const email = req.body.email;
      const name = req.body.name;
      const tag = req.body.tag;
      const userid = req.body.userid;

      const query = { _id: userid };
      const updatedoc = {
        name: name,
        email: email,
        tag: tag,
      };
      const update = await User.updateOne(query, updatedoc);
      if (update?.nModified == "1") {
        res.send({
          success: true,
        });
      } else {
        return res.status(500).json({
          success: false,
        });
      }
    } catch (error) {
      console.log(" error occured in while updating your profile", error);
    }
  } else {
    return res.status(403).json({
      message:
        "you are not authanticated please login to update you profile...",
    });
  }
});

///<<<<<<<<<===========================================================================================>>>>>>>>
///                               Password Reset
///<<<<<<<<<===========================================================================================>>>>>>>>

router.post("/resetpassword", async (req, res) => {
  const email = req.body.email;

  await User.find({ email }).exec((err, result) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: "some error occured",
      });
    }
    if (result.length > 0) {
      const OTPcode = (1345 + Math.floor(Math.random() * 1000000))
        .toString()
        .trim(0, 5);
      // redis code and send email
      console.log("OTPcode for ", email, " is ", OTPcode);
      client.setEx(email, 300, OTPcode);
      // sending email part
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "shamailabbas61@gmail.com",
          pass: "93076667",
        },
      });

      var mailOptions = {
        from: "shamailabbas61@gmail.com",
        to: "shamaelabbas61@gmail.com",
        subject: "Password Reset Veerification for Areagg",
        html: `<p>Your OTPcode for password reset is ${OTPcode}</p>`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
          return res.status(202).json({
            success: true,
            message: "check your email ",
          });
        }
      });
      //end of sending email part
    } else
      return res.status(401).json({
        success: false,
        message: "wrong email!!!",
      });
  });
});

//==========================================================
//    confirm reset password by checking OTP code
//==========================================================
router.post("/confirmpasswordreset", async (req, res) => {
  const OTPcode = req.body.OTPcode;
  const email = req.body.email;
  const newpassword = req.body.newpassword;
  const confirmnewpassword = req.body.confirmnewpassword;

  if (!email)
    return res.json({
      success: false,
      error: { email: "email is not present" },
    });
  if (!OTPcode)
    return res.json({
      success: false,
      error: { OTPcode: "OTPcode is not present" },
    });
  if (!newpassword)
    return res.json({
      success: false,
      error: { newpassword: "newpassword is not present" },
    });
  if (!confirmnewpassword)
    return res.json({
      success: false,
      error: { confirmnewpassword: "confirm new password is not present" },
    });
  if (newpassword !== confirmnewpassword)
    return res.json({
      success: false,
      error: { password: "Password do match" },
    });

  if (email && OTPcode && newpassword === confirmnewpassword) {
    const otp = await client.get(email);

    if (otp == OTPcode) {
      //updatepassword logic start
      const encryptednewpassword = await bcrypt.hash(req.body.newpassword, 10);
      console.log("encrypted psd is ", encryptednewpassword);
      const query = { email };
      const updatedoc = {
        password: encryptednewpassword,
      };

      const update = await User.updateOne(query, updatedoc);
      if (update?.nModified == "1") {
        return res.status(200).json({
          success: true,
          message: "password reset successfully",
        });
      }
    }
  }

  return res.send({
    success: false,
    error: "Your OTP is incorrect or expired",
  });
});
module.exports = router;
