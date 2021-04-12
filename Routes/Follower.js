const express = require("express");
const Userpost = require("../Models/userposts.js");
const router = express.Router();

router.post("/addfollower", async (req, res) => {
  const whomtofollow = req.body.whomtofollow;
  const follower = req.body.follower;
  console.log(
    "<<<<whomtofollow>>>",
    whomtofollow,
    "<<<<follower>>>>",
    follower
  );
  const query = { owner: whomtofollow };
  const updatedoc = {
    $addToSet: {
      follower: { follower_id: follower },
    },
  };
  const followeradd = await Userpost.updateOne(query, updatedoc);
  if (followeradd.nModified == "0") {
    console.log(followeradd.nModified);
    res.send({ success: false });
  }
  console.log("follower.nModified>>>>>", followeradd);
  if (followeradd.nModified == "1") {
    console.log("follower.nModified>>>>>", followeradd.nModified);
    console.log("followeradded>>>>>", followeradd);
    {
      const query = { owner: follower };
      const updatedoc = {
        $addToSet: {
          following: { following_id: whomtofollow },
        },
      };
      const followingadded = await Userpost.updateOne(query, updatedoc);
      console.log("followingadded", followingadded);
      return res.json({ success: true });
    }
  }
});
module.exports = router;
