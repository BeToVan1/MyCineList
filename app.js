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
            title: String
        }
    ]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://mycinelist.cyclic.cloud/auth/google/MyCineList",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        //console.log(profile);
        User.findOrCreate({ googleId: profile.id, username: profile.displayName }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get('./movies.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    // Rest of the code to send the file
});

app.get("/", function (req, res) {
    res.render("index");
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/MyCineList',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/loggedin');
    });

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/mylist", async (req, res) => {
    try {
        const foundUser = await User.findById(req.user._id);
        //console.log(req);
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



app.get("/loggedin", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("loggedin");
    } else {
        res.redirect("login");
    }
});

//need to add logout button 
app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
});

//save movie score
app.get("/save-movie-score", function (req, res) {
    c
    res.json({ message: 'Movie scores retrieved successfully' });
});

//register 
app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                //placeholder
                res.redirect("/loggedin");
            });
        }
    });

});

//login 
app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    //console.log(req);
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                //placeholder
                res.redirect("/loggedin");
            });
        }
    });
});

//remove from list
app.post("/remove", async (req, res) => {
    try {
        const movieIdToRemove = req.body.movieId;
        const foundUser = await User.findById(req.user._id);
        
        if (foundUser) {
            for(var i = foundUser.movieIds.length -1; i >= 0; --i){
                console.log(foundUser.movieIds[i].movieId);
                if(parseInt(foundUser.movieIds[i].movieId) === parseInt(movieIdToRemove)){
                    //console.log("pog");
                    foundUser.movieIds.splice(i,1);
                    await foundUser.save();
                    res.redirect("mylist");
                }
            }
        } else {
            console.log("user not found when removing movie");
        }
    }catch(err){
        console.log(err);      
    }

});

//save movie score to db
app.post("/save-movie-score", async (req, res) => {
    try {
        // Extract data from the request body
        const movie = { movieId: req.body.movieId, score: req.body.score, imgURL: req.body.imgURL, title: req.body.title };
        // Find the user by their ID and await the result
        const foundUser = await User.findById(req.user._id);
        if (foundUser) {
            // Push the movie object into the movieIds array
            const alreadyAdded = foundUser.movieIds.find(movies => parseInt(movies.movieId) === parseInt(movie.movieId));
            if (alreadyAdded) {
                alreadyAdded.score = movie.score;
            }
            else {
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

app.get("/moviepage", async (req, res) => {
    try {
        const movieId = req.query.movie_id;
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMTE5MzkyZDJjNDRlNWYzYjI3MGY1YWRlNWFjMjIxZCIsInN1YiI6IjY0ZmFkYWM2ZmZjOWRlMDEzOGViYWZhZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.CXi3K75a6AwYUhEm8yG_QtO2colywujc7Mi3MymUozw'
            }
        };
  
      // Make the first fetch request to get movie details
      const movieInfoPromise = fetch(`https://api.themoviedb.org/3/movie/${movieId}?language=en-US`, options)
        .then(response => response.json())
        .then(response => {
          return {
            title: response.title,
            overview: response.overview,
            poster_path: response.poster_path,
            score: response.vote_average,
            genres: response.genres
          };
        });
  
      // Make a second fetch request (example)
      const trailerPromise = fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?language=en-US`, options)
        .then(response => response.json())
        .then(response =>{
            return response.results[0].key;
        })
        .catch(err => console.error(err));
        
  
      // Use Promise.all to wait for both promises to resolve
      Promise.all([movieInfoPromise, trailerPromise])
        .then(([movieInfo, trailer]) => {
          console.log(movieInfo);
          console.log(trailer);
  
          // Render the "moviepage" template with the collected data
          res.render("moviepage", { movieInfo, trailer });
        })
        .catch(err => {
          console.error(err);
          res.status(500).send("Internal Server Error 1");
        });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error 2");
    }
  });
  
  
  


app.listen(PORT, function () {
    console.log("Server started on port 3000");
});
