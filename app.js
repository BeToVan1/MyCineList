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
const MongoStore = require("connect-mongo");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

app.use(passport.initialize());
app.use(passport.session());

//connects to db
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });


//schema for user
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    movieIds: [
        {
            movieId: Number,
            score: Number,
            imgURL: String,
            year: String,
            genres: [String],
            title: String
        }
    ]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (storedUser, done) => {
    try {
        // Active sessions created by earlier versions contain the user object.
        const id = storedUser._id || storedUser;
        done(null, await User.findById(id).select('_id username movieIds') || false);
    } catch (error) {
        done(error);
    }
});
// google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL:
        process.env.NODE_ENV === "production"
            ? process.env.PROD_CALLBACK_URL
            : process.env.DEV_CALLBACK_URL,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        //console.log(profile);
        User.findOrCreate({ googleId: profile.id, username: profile.displayName }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

// redirect when user is logged in 
app.get('/auth/google/MyCineList',
    passport.authenticate('google', {
        failureRedirect: '/login',
        successReturnToOrRedirect: '/loggedin',
        keepSessionInfo: true
    }));


// Keep the existing Render integration working while allowing a managed token.
async function tmdb(path, params) {
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMTE5MzkyZDJjNDRlNWYzYjI3MGY1YWRlNWFjMjIxZCIsInN1YiI6IjY0ZmFkYWM2ZmZjOWRlMDEzOGViYWZhZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.CXi3K75a6AwYUhEm8yG_QtO2colywujc7Mi3MymUozw'
            }
        };
  

    if (process.env.TMDB_READ_TOKEN) {
        options.headers.Authorization = 'Bearer ' + process.env.TMDB_READ_TOKEN;
    }
    const url = new URL('https://api.themoviedb.org/3/' + path);
    url.search = new URLSearchParams({language: 'en-US', ...params});
    const response = await fetch(url, {...options, signal: AbortSignal.timeout(10000)});
    if (!response.ok) {
        const error = new Error('Movie data is unavailable.');
        error.status = response.status === 404 ? 404 : 502;
        throw error;
    }
    return response.json();
}

require('./screening-room')(app, {User, passport, tmdb});

app.listen(PORT, () => console.log('MyCineList listening on port ' + PORT));
