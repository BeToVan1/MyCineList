require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
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
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({
    extended: true
}));

// Reuse a single MongoDB pool for account data and sessions on each instance.
let sessionMiddleware;
function getSessionMiddleware() {
    if (!sessionMiddleware) {
        sessionMiddleware = mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 8000
        }).then(() => session({
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            proxy: process.env.VERCEL === '1',
            cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.VERCEL === '1' },
            store: MongoStore.create({ client: mongoose.connection.getClient(),
                dbName: mongoose.connection.name })
        })).catch(error => {
            sessionMiddleware = null;
            throw error;
        });
    }
    return sessionMiddleware;
}
app.use((req, res, next) => {
    if (req.method === 'GET') {
        if (req.path === '/api/catalog' || /^\/api\/films\/\d+$/.test(req.path)) return next();
        if (req.path === '/api/session' && !req.headers.cookie) {
            return res.set('Cache-Control', 'private, no-store').json({ userId: null, library: [] });
        }
    }
    getSessionMiddleware().then(middleware => middleware(req, res, next)).catch(next);
});

app.use(passport.initialize());
const restoreSession = passport.session();
app.use((req, res, next) => req.session ? restoreSession(req, res, next) : next());

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


async function tmdb(path, params) {
    const token = (process.env.TMDB_READ_TOKEN || '').trim().replace(/^Bearer\s+/i, '');
    const options = { headers: { accept: 'application/json', Authorization: 'Bearer ' + token } };
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

module.exports = app;
if (require.main === module) {
    app.listen(PORT, () => console.log('MyCineList listening on port ' + PORT));
}
