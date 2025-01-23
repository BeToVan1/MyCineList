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

// get request for movie data
app.get('./movies.js', async (req, res) => {
    try {
        const foundUser = await User.findById(req.user._id);
        //console.log(req);
        if (foundUser) {
            const movieData = foundUser.movieIds;
            res.send({userMovies : movieData});
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});

// default route
app.get("/", function (req, res) {
    res.render("index");
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

// redirect when user is logged in 
app.get('/auth/google/MyCineList',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/loggedin');
    });

// redirect to login page
app.get("/login", function (req, res) {
    res.render("login");
});

// redirect to register page
app.get("/register", function (req, res) {
    res.render("register");
});
// redirect to my list
app.get("/mylist", async (req, res) => {
    try {
        const foundUser = await User.findById(req.user._id);
        //console.log(req);
        if (foundUser) {
            const movieData = foundUser.movieIds;
            const shareableLink = `${req.protocol}://${req.get('host')}/list/${foundUser._id}`;
            res.render("mylist", { movieData, sortOrder: " ", scoreOrder: " ", shareableLink });
            //console.log(movieData);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});
//sort titles alphabetically inc
app.get("/mylist-title-inc", async (req, res) => {
    try {
        const foundUser = await User.findById(req.user._id);
        //console.log(req);
        if (foundUser) {
            const movieData = foundUser.movieIds;
            const shareableLink = `${req.protocol}://${req.get('host')}/list/${foundUser._id}`;
            //console.log(movieData);
            movieData.sort((a,b) => {
                if (a.title < b.title) return -1;
                if (a.title > b.title) return 1;
                return 0;
            });
            res.render("mylist", { movieData, sortOrder : "(increasing)",scoreOrder: " ", shareableLink });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});
//sort titles alphabetically dec
app.get("/mylist-title-dec", async (req, res) => {
    try {
        const foundUser = await User.findById(req.user._id);
        //console.log(req);
        if (foundUser) {
            const movieData = foundUser.movieIds;
            const shareableLink = `${req.protocol}://${req.get('host')}/list/${foundUser._id}`;
            //console.log(movieData);
            movieData.sort((a,b) => {
                if (a.title > b.title) return -1;
                if (a.title < b.title) return 1;
                return 0;
            });
            res.render("mylist", { movieData, sortOrder : "(decreasing)",scoreOrder: " ", shareableLink });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});
//sort scores dec
app.get("/mylist-score-dec", async (req, res) => {
    try {
        const foundUser = await User.findById(req.user._id);
        //console.log(req);
        if (foundUser) {
            const movieData = foundUser.movieIds;
            const shareableLink = `${req.protocol}://${req.get('host')}/list/${foundUser._id}`;
            //console.log(movieData);
            movieData.sort((a,b) => {
                if (a.score > b.score) return -1;
                if (a.score < b.score) return 1;
                return 0;
            });
            res.render("mylist", { movieData, scoreOrder : "(decreasing)",sortOrder: " ", shareableLink });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});
//sort scores inc
app.get("/mylist-score-inc", async (req, res) => {
    try {
        const foundUser = await User.findById(req.user._id);
        const shareableLink = `${req.protocol}://${req.get('host')}/list/${foundUser._id}`;
        //console.log(req);
        if (foundUser) {
            const movieData = foundUser.movieIds;
            //console.log(movieData);
            movieData.sort((a,b) => {
                if (a.score < b.score) return -1;
                if (a.score > b.score) return 1;
                return 0;
            });
            res.render("mylist", { movieData, scoreOrder : "(increasing)",sortOrder: " ", shareableLink });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});



app.get("/loggedin", async (req, res) =>{
    try {
        if (req.isAuthenticated()) {
            const foundUser = await User.findById(req.user._id);
            if(foundUser){
                const movieData = foundUser.movieIds;
                res.render("loggedin", {movieData});
            }else{
                res.status(404).json({ message: 'User not found' });
            }
        } else {
            res.redirect("login");
        }
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Error fetching user data' });
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
        //console.log(movieId);
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
            genres: response.genres,
            id: movieId
          };
        });
  
      // Make a second fetch request to get trailer link
      const trailerPromise = fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?language=en-US`, options)
        .then(response => response.json())
        .then(response =>{
            return response.results[0].key;
        })
        .catch(err => console.error(err));
    
      // Make a third fetch request to get cast
      const castPromise = fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?language=en-US`, options)
        .then(response => response.json())
        .then(response =>{
            return response.cast;
        })
        .catch(err => console.error(err));
      // Use Promise.all to wait for both promises to resolve
      Promise.all([movieInfoPromise, trailerPromise, castPromise])
        .then(([movieInfo, trailer, cast]) => {
          //console.log(movieInfo);
          //console.log(trailer);
          //console.log(cast);
          // Render the "moviepage" template with the collected data
          res.render("moviepage", { movieInfo, trailer, cast });
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

  app.get('/api/user-movie-data', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const foundUser = await User.findById(userId);
        if (foundUser) {
            res.json(foundUser.movieIds);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch user movie data' });
    }
});

//public route to view a user's movie list
app.get("/list/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const foundUser = await User.findById(userId);
        if (foundUser) {
            const movieData = foundUser.movieIds;
            res.render("public-list", { movieData, username: foundUser.username, sortOrder: " ", scoreOrder: " " }); // Create a public-list.ejs template
        } else {
            res.status(404).send("User not found or list is private.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching user list.");
    }
});
//sort titles alphabetically inc (public list)
app.get("/list-title-inc/:userId", async (req, res) => {
    try {
        const foundUser = await User.findById(req.user._id);
        //console.log(req);
        if (foundUser) {
            const movieData = foundUser.movieIds;
            //console.log(movieData);
            movieData.sort((a,b) => {
                if (a.title < b.title) return -1;
                if (a.title > b.title) return 1;
                return 0;
            });
            res.render("public-list", { movieData, username: foundUser.username, sortOrder : "(increasing)",scoreOrder: " " });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});
//sort titles alphabetically dec (public list)
app.get("/list-title-dec/:userId", async (req, res) => {
    try {
        const foundUser = await User.findById(req.user._id);
        //console.log(req);
        if (foundUser) {
            const movieData = foundUser.movieIds;
            //console.log(movieData);
            movieData.sort((a,b) => {
                if (a.title > b.title) return -1;
                if (a.title < b.title) return 1;
                return 0;
            });
            res.render("public-list", { movieData, username: foundUser.username, sortOrder : "(decreasing)",scoreOrder: " " });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});
//sort scores dec (public list)
app.get("/list-score-dec/:userId", async (req, res) => {
    try {
        const foundUser = await User.findById(req.user._id);
        //console.log(req);
        if (foundUser) {
            const movieData = foundUser.movieIds;
            //console.log(movieData);
            movieData.sort((a,b) => {
                if (a.score > b.score) return -1;
                if (a.score < b.score) return 1;
                return 0;
            });
            res.render("public-list", { movieData, username: foundUser.username, scoreOrder : "(decreasing)",sortOrder: " " });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});
//sort scores inc (public list)
app.get("/list-score-inc/:userId", async (req, res) => {
    try {
        const foundUser = await User.findById(req.user._id);
        //console.log(req);
        if (foundUser) {
            const movieData = foundUser.movieIds;
            //console.log(movieData);
            movieData.sort((a,b) => {
                if (a.score < b.score) return -1;
                if (a.score > b.score) return 1;
                return 0;
            });
            res.render("public-list", { movieData, username: foundUser.username, scoreOrder : "(increasing)",sortOrder: " " });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});
  
  
app.listen(PORT, function () {
    console.log("Server started on port 3000");
});
