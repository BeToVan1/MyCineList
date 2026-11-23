# 🎬 MyCineList

MyCineList is a full-stack web application that allows users to discover movies, rate them, and build personalized movie lists. Users can sign in with Google, search for movies, assign ratings, manage their watchlist, and share their movie collection with others.

## 🌐 Live Demo

**[View MyCineList](https://mycinelist.onrender.com/)**

> The application is hosted on Render, so the initial load may take a few moments if the server has been inactive.

## ✨ Features

- 🔐 **Google Authentication** — Sign in using Google OAuth
- 🔎 **Movie Search** — Search for movies using data from the TMDB API
- ⭐ **Movie Ratings** — Rate movies on a 1–10 scale
- 📋 **Personal Movie Lists** — Save and manage movies in your own collection
- ↕️ **Sorting** — Sort movies within your personal list
- 🔗 **Shareable Lists** — Share your movie list with others
- 🎥 **Now Playing** — Browse movies that are currently playing
- 🎞️ **Film discovery** — Explore the featured film and curated shelf, filter by genre, or search the live TMDB catalog

## 🛠️ Tech Stack

### Frontend
- HTML
- CSS
- JavaScript
- EJS

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Authentication
- Passport.js
- Google OAuth

### API
- TMDB (The Movie Database) API

### Deployment
- Render

## ⚙️ How It Works

MyCineList integrates with the TMDB API to retrieve movie information such as titles, posters, descriptions, and currently playing movies.

Users authenticate through Google OAuth and can search for movies, add them to their personal collection, and assign ratings from 1–10. User information and movie ratings are persisted in MongoDB.

The application uses Express.js for backend routing and application logic, EJS for server-side rendering, and JavaScript for client-side interactions.

## 💡 What I Learned

Building MyCineList gave me experience developing and deploying a full-stack application from end to end. Some of the key areas I worked with included:

- Building backend routes with Node.js and Express
- Integrating third-party APIs
- Implementing Google OAuth authentication
- Designing MongoDB/Mongoose data models
- Managing authentication and user sessions
- Creating asynchronous client-server interactions
- Debugging frontend and backend issues
- Connecting user-facing functionality with persistent data
- Deploying and maintaining a full-stack web application

One of the biggest lessons from this project was understanding how different layers of a full-stack application interact. Features often required coordinating frontend behavior, backend routes, authentication, external APIs, and database state rather than treating each part of the application independently.

## 👤 Author

**Bevan To**

Computer Science graduate from the University of California, Irvine.

## 🙏 Acknowledgements

Movie data and images are provided by **TMDB (The Movie Database)**.

This product uses the TMDB API but is not endorsed or certified by TMDB.
