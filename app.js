const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

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
    res.render("index");
});

app.get("/register", function(req,res){
    res.render("register");
});

app.listen(3000,function(){
    console.log("Server started on port 3000");
});
//google oauth