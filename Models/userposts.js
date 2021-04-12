const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userpostSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  following: [
    {
      following_id: { type: Schema.Types.ObjectId, ref: "User" },
      _id: false,
    },
  ],
  follower: [
    {
      follower_id: { type: Schema.Types.ObjectId },
      _id: false,
    },
  ],
  post: [
    {
      postpath: { type: String },
      title: { type: String },
      desc: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const Userpost = mongoose.model("Userpost", userpostSchema);

module.exports = Userpost;
