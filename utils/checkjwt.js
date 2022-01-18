const jwt = require("jsonwebtoken");
require("dotenv").config();
module.exports=function checkjwt(req,res,next){

const jwttoken=req.headers?.authorization.split(" ")[1];

if(jwttoken)
try {
     const decoded= jwt.verify(jwttoken,process.env.jwtsecret)
   if(decoded)
     req.jwttoken=jwttoken
} catch (error) {
    console.log("error.....with jwt is>>> ",error.toString().trim(0,50))
}  
next()
}