const express = require("express");
const cors = require("cors");
require("dotenv").config();
const client = require("./redis");

const mongoose = require("mongoose");

const app = express();

mongoose
  .connect(process.env.mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) =>
    console.log(
      "You seems to have poor internet or your mongourl is not correct, try again..."
    )
  );

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

// app.use("/uploads", express.static("uploads"));
// app.use("/uploads/profilepics", express.static("uploads/profilepics"));
// app.use("/upload/addpost", express.static("uploads/posts"));

app.use("/user", require("./Routes/Auth"));
app.use("/post", require("./Routes/Post"));
app.use("/follow", require("./Routes/Follower"));

app.get("/", (req, res) => {
  res.send("Welcome to Areagg");
});
const port = process.env.PORT || 5000;

app.listen(port, async () => {
  console.log(`Server Running at ${port}`);

  await client.connect();
  client.on("error", (err) => {
    console.log("Error " + err);
  });
});
mongoose.set("useFindAndModify", false);
