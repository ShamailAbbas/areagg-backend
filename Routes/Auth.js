const express = require("express");
const router = express.Router();
const multer = require("multer");
let path = require("path");
const User = require("../Models/user.js");
const Userpost = require("../Models/userposts.js");
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profilepics");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    cb(null, true);
  },
});

var upload = multer({ storage: storage }).single("profilepic");

//<<<<<<<<<<<<===============================================>>>>>>>>>>>>>>>>>
//                      user signup and   Userprofilepic upload
//<<<<<<<<<<<<===============================================>>>>>>>>>>>>>>>>>

router.post("/signup", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.json({ success: false, err });
    }

    //<<<<<<<<<===========================================================================================>>>>>>>>
    //                user data will be sent to database if storing pic in the server is successfull
    //<<<<<<<<<===========================================================================================>>>>>>>>
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const profilepic = res.req.file.path;

    const newuser = new User({ name, email, password, profilepic });
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

///<<<<<<<<<===========================================================================================>>>>>>>>
///                               user login
///<<<<<<<<<===========================================================================================>>>>>>>>

router.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log(email);
  await User.find({ email, password }).exec((err, result) => {
    if (err) {
      return res.status(400).send(err);
    }
    if (result.length > 0)
      return res.send({
        login: true,
        user: result,
      });
    else
      return res.send({
        login: false,
      });
  });
});
///<<<<<<<<<===========================================================================================>>>>>>>>
///                               user profile update
///<<<<<<<<<===========================================================================================>>>>>>>>

router.post("/update", async (req, res) => {
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
    res.send({
      success: false,
    });
  }
});
module.exports = router;
