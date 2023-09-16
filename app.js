require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
})

const User = new mongoose.model("User", userSchema);


// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const findOrCreate = require('mongoose-findorcreate');

// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/MyCineList",
//     userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));

// const userSchema = new mongoose.Schema ({
//     email: String,
//     password: String
// })

// userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(findOrCreate);

// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['profile'] }));
app.get('./movies.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    // Rest of the code to send the file
});

app.get("/", function(req,res){
    res.render("index");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});

app.post("/register", (req,res) => {
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });

    newUser
        .save()
        .then(() =>{
            //placeholder- should render logged in 
            res.render("index");
        });
});

app.post("/login", function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: username}).exec()
    .then((foundUser) => {
        if(foundUser){
            if(foundUser.password === password){
                //placeholder
                res.render("index");
            }
        }
    }).catch((err) =>{
        console.log(err);
    });
       
});

app.listen(3000,function(){
    console.log("Server started on port 3000");
});
//google oauth