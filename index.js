const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

const app = express();

mongoose
  .connect(process.env.mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

// app.use("/image", require("./routes/image"));

//use this to show the image you have in node js server to client (react js)
//https://stackoverflow.com/questions/48914987/send-image-path-from-node-js-express-server-to-react-client
app.use("/uploads", express.static("uploads"));
app.use("/uploads/profilepics", express.static("uploads/profilepics"));
app.use("/upload/addpost", express.static("uploads/posts"));

app.use("/user", require("./Routes/Auth"));
app.use("/post", require("./Routes/Post"));
app.use("/follow", require("./Routes/Follower"));

app.get("/", (req, res) => {
  res.send("Welcome to Areagg");
});
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server Running at ${port}`);
});
mongoose.set("useFindAndModify", false);
