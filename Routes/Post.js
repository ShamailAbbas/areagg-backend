const express = require("express");
const router = express.Router();
const multer = require("multer");
let path = require("path");
const mongoose = require("mongoose");
const User = require("../Models/user.js");
const Userpost = require("../Models/userposts.js");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/posts");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extdesc(file.originaldesc);

    cb(null, true);
  },
});

var upload = multer({ storage: storage }).single("file");

//<<<<<<<<<<<<===============================================>>>>>>>>>>>>>>>>>
//            addpost upload post pic or video to the server
//<<<<<<<<<<<<===============================================>>>>>>>>>>>>>>>>>

router.post("/addpost", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.json({ success: false, err });
    }

    ///<<<<<<<<<===========================================================================================>>>>>>>>
    ///           post details will be sent to database if storing pic/video in the server is successfull
    ///<<<<<<<<<===========================================================================================>>>>>>>>

    const owner = req.body.owner;
    const post = {
      title: req.body.title,
      desc: req.body.desc,
      postpath: res.req.file.path,
    };

    const query = { owner: owner };
    const updatedoc = {
      $push: { post: post },
    };
    Userpost.updateOne(query, updatedoc).then((result) => {
      if (result.nModified == "1") {
        return res.json({
          success: true,
        });
      } else {
        return res.json({
          success: false,
        });
      }
    });
  });
});

///<<<<<<<<<=========================================================>>>>>>>>
///                         get posts
///<<<<<<<<<=======================================================>>>>>>>>

router.post("/getposts", async (req, res) => {
  const currentuser = req.body.currentuser;

  var pipeline = [
    {
      $match: {
        follower: {
          follower_id: mongoose.Types.ObjectId(currentuser),
        },
      },
    },
    {
      $unwind: "$post",
    },
    {
      $project: { follower: 0, following: 0 },
    },
    {
      $sort: {
        "post.createdAt": -1,
      },
    },
    {
      $limit: 100,
    },
  ];
  const posts = await Userpost.aggregate(pipeline);

  if (posts.length > 0) {
    User.populate(posts, { path: "owner" }, function (err, populatedposts) {
      console.log(
        "all your timeline feeds are  based on your connections",
        populatedposts
      );
      res.send({ posts: populatedposts });
    });
  }

  ///<<<<<<<<<==============================================================================================================>>>>>>>>
  ///        if the user is not following anyone or if he is a new user then some random posts will be shown on his timeline
  ///<<<<<<<<<============================================================================================================>>>>>>>>
  else {
    const currentuser = req.body.currentuser;

    var pipeline = [
      {
        $unwind: "$post",
      },
      {
        $project: { follower: 0, following: 0 },
      },
      {
        $sort: {
          "post.createdAt": -1,
        },
      },
      {
        $limit: 100,
      },
    ];
    const posts = await Userpost.aggregate(pipeline);
    User.populate(posts, { path: "owner" }, function (err, populatedposts) {
      console.log(
        "all your timeline feeds are random because you are not following any one",
        populatedposts
      );
      res.send({ posts: populatedposts });
    });
  }
});

///<<<<<<<<<======================================================================================================>>>>>>>>
///    get random posts for top horizontal section actually it is not random posts it is random users
///<<<<<<<<<======================================================================================================>>>>>>>>

router.post("/getrandomposts", async (req, res) => {
  const currentuser = req.body.currentuser;

  var pipeline = [
    {
      $match: { owner: { $nin: [mongoose.Types.ObjectId(currentuser)] } },
    },
    {
      $match: {
        "follower.follower_id": {
          $nin: [mongoose.Types.ObjectId(currentuser)],
        },
      },
    },

    {
      $project: { _id: 0, owner: 1 },
    },
    // {
    //   $limit: 5,
    // },
  ];
  const posts = await Userpost.aggregate(pipeline).exec(function (
    err,
    unpopulatedposts
  ) {
    // Don't forget your error handling

    User.populate(
      unpopulatedposts,
      { path: "owner" },
      function (err, populatedposts) {
        res.send({ users: populatedposts });
      }
    );
  });
});

///<<<<<<<<<====================================================================================>>>>>>>>
///                         get couser stats like no of followers,posts setc
///<<<<<<<<<====================================================================================>>>>>>>>

router.post("/getuserinfo", async (req, res) => {
  const user = req.body.userid;
  const couser = req.body.couserid;
  console.log("user is", user);
  console.log("couser is", couser);
  var pipeline = [
    {
      $match: {
        owner: mongoose.Types.ObjectId(couser),
      },
    },
  ];
  const users = await Userpost.aggregate(pipeline);

  ///<<<<<<<<<====================================================================================>>>>>>>>
  ///                         to check wether the current user is following this user or not
  ///<<<<<<<<<====================================================================================>>>>>>>>

  var secondpipeline = [
    {
      $match: {
        owner: mongoose.Types.ObjectId(couser),
      },
    },
    {
      $match: {
        "follower.follower_id": mongoose.Types.ObjectId(user),
      },
    },
  ];

  const amifollowing = await Userpost.aggregate(secondpipeline);
  console.log("am i following thsi user", amifollowing);
  console.log("stats>>>>>>>>>>>>>>>>>>", users);

  res.send({
    posts: users[0]?.post.length,
    followers: users[0]?.follower.length,
    following: users[0]?.following.length,
    amifollowing: amifollowing?.length,
  });
});
///<<<<<<<<<=========================================================>>>>>>>>
///                         get random user
///<<<<<<<<<=========================================================>>>>>>>>

router.post("/getrandomusers", async (req, res) => {
  const currentuser = req.body.currentuser;

  var pipeline = [
    {
      $match: {
        _id: { $nin: [mongoose.Types.ObjectId(currentuser)] },
      },
    },
  ];
  const users = await User.aggregate(pipeline);
  res.send({ users: users });
});

module.exports = router;
