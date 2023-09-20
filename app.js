require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//connects to db
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});


//schema for user
const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
    movieIds: [
        {
            movieId : Number,
            score: Number,
            imgURL: String,
            title: String
        }
    ]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
    done(null,user);
});

passport.deserializeUser(function(user,done){
    done(null,user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/MyCineList",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('./movies.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    // Rest of the code to send the file
});

app.get("/", function(req,res){
    res.render("index");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/MyCineList', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/loggedin');
  });

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});

app.get("/mylist", async (req, res) => {
    try {
        const foundUser = await User.findById(req.user._id);
        if (foundUser) {
            const movieData = foundUser.movieIds;
            res.render("mylist", { movieData });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});

app.get("/loggedin", function(req,res){
    if(req.isAuthenticated()){
        res.render("loggedin");
    }else{
        res.redirect("login");
    }
});

//need to add logout button 
app.get("/logout", function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
        res.redirect('/');
    });
});

//save movie score
app.get("/save-movie-score", function(req,res){
    console.log("pogger");
    res.json({ message: 'Movie scores retrieved successfully' });
});

//register 
app.post("/register", (req,res) => {
    User.register({username: req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                //placeholder
                res.redirect("/loggedin");
            });
        }
    });
    
});

//login 
app.post("/login", function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    //console.log(req);
    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                //placeholder
                res.redirect("/loggedin");
            });
        }
    });
});

//save movie score to db
app.post("/save-movie-score", async (req, res) => {
    try {
        // Extract data from the request body
        const movie = { movieId: req.body.movieId, score: req.body.score, imgURL: req.body.imgURL, title: req.body.title };
        console.log(req.body.imgURL);
        // Find the user by their ID and await the result
        const foundUser = await User.findById(req.user._id);
        if (foundUser) {
            // Push the movie object into the movieIds array
            const alreadyAdded = foundUser.movieIds.find(movies => parseInt(movies.movieId) === parseInt(movie.movieId));
            if(alreadyAdded){
                alreadyAdded.score = movie.score;
            }
            else{
                foundUser.movieIds.push(movie);
            }
            await foundUser.save(); // Save the changes to the database
            console.log("success");
            res.json({ message: 'Score updated successfully' });
        } else {
            // Handle the case where the user is not found (e.g., send a not found response)
            res.render("login");
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        // Handle any errors that occur during the process (e.g., send an error response)
        res.status(500).json({ message: 'Error updating user' });
    }
});


app.listen(3000,function(){
    console.log("Server started on port 3000");
});
//google oauth