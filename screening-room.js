const mongoose = require("mongoose");

const genreNames = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};
const sortAliases = {
  "title-inc": "title",
  "title-dec": "title-desc",
  "score-inc": "rating-asc",
  "score-dec": "rating",
};
function movieId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
function filmData(movie) {
  const minutes = movie.runtime;
  const video = movie.videos?.results.find(
    (v) => v.site === "YouTube" && v.type === "Trailer",
  );
  return {
    id: movie.id,
    title: movie.title,
    synopsis: movie.overview || "",
    year: (movie.release_date || "").slice(0, 4),
    genres: movie.genres
      ? movie.genres.map((g) => genreNames[g.id] || g.name)
      : (movie.genre_ids || []).map((id) => genreNames[id]).filter(Boolean),
    score: movie.vote_average || null,
    runtime: minutes
      ? [
          Math.floor(minutes / 60) && Math.floor(minutes / 60) + "h",
          minutes % 60 && (minutes % 60) + "m",
        ]
          .filter(Boolean)
          .join(" ")
      : "",
    poster: movie.poster_path
      ? "https://image.tmdb.org/t/p/w500" + movie.poster_path
      : "",
    director:
      movie.credits?.crew
        .filter((p) => p.job === "Director")
        .map((p) => p.name)
        .join(", ") || "",
    cast: (movie.credits?.cast || []).slice(0, 5).map((p) => p.name),
    trailer: video?.key || "",
  };
}
function savedFilms(user) {
  return (user?.movieIds || []).map((m) => ({
    id: m.movieId,
    title: m.title,
    poster: m.imgURL || "",
    rating: m.score ?? null,
    year: m.year || "",
    genres: m.genres || [],
  }));
}
function allowedPoster(value) {
  if (/^\/assets\/\d+\.webp$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      ["image.tmdb.org", "media.themoviedb.org", "www.themoviedb.org"].includes(
        url.hostname,
      ) &&
      url.pathname.startsWith("/t/p/")
    )
      return url.href;
  } catch {}
  return "";
}
module.exports = function registerScreeningRoom(app, { User, passport, tmdb }) {
  const asyncRoute = (handler) => (req, res, next) =>
    Promise.resolve(handler(req, res)).catch(next);
  const requireUser = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.session.returnTo = req.path;
    res.redirect("/login");
  };
  const requireApiUser = (req, res, next) =>
    req.isAuthenticated()
      ? next()
      : res.status(401).json({ message: "Sign in to save films." });
  function render(req, res, state = {}) {
    res.set("Cache-Control", "private, no-store");
    const pageTitle =
      { list: "My list", shared: "Shared list" }[state.page] || "Discover";
    res.render("screening-room", {
      pageTitle,
      state: {
        page: "discover",
        userId: req.user ? String(req.user._id) : null,
        library: savedFilms(req.user),
        query: typeof req.query.q === "string" ? req.query.q.slice(0, 200) : "",
        ...state,
      },
    });
  }
  app.get("/", (req, res) => render(req, res));
  app.get("/loggedin", requireUser, (req, res) => render(req, res));
  app.get("/moviepage", (req, res) => {
    const id = movieId(req.query.movie_id);
    if (!id) return res.redirect("/");
    render(req, res, { filmId: id });
  });
  function registerLists(suffix = "", sort = "recent") {
    app.get("/mylist" + suffix, requireUser, (req, res) =>
      render(req, res, { page: "list", sort }),
    );
    app.get(
      "/list" + suffix + "/:userId",
      asyncRoute(async (req, res) => {
        const id = req.params.userId;
        const owner = mongoose.isObjectIdOrHexString(id)
          ? await User.findById(id).select("movieIds")
          : null;
        if (!owner) return res.status(404).send("List not found.");
        render(req, res, { page: "shared", entries: savedFilms(owner), sort });
      }),
    );
  }
  registerLists();
  for (const [suffix, sort] of Object.entries(sortAliases))
    registerLists("-" + suffix, sort);

  app.get(["/login", "/register"], (req, res) => {
    const filmId = movieId(req.query.film);
    if (filmId) req.session.returnTo = "/moviepage?movie_id=" + filmId;
    res.render("account", {
      register: req.path === "/register",
      problem: req.query.retry === "1",
      signedIn: req.isAuthenticated(),
      count: req.user?.movieIds.length || 0,
    });
  });
  app.post(
    "/login",
    passport.authenticate("local", {
      successReturnToOrRedirect: "/loggedin",
      keepSessionInfo: true,
      failureRedirect: "/login?retry=1",
    }),
  );
  app.post("/register", (req, res, next) => {
    User.register(
      { username: req.body.username },
      req.body.password,
      (error, user) => {
        if (error) return res.redirect("/register?retry=1");
        const destination = req.session.returnTo || "/loggedin";
        delete req.session.returnTo;
        req.login(user, (error) =>
          error ? next(error) : res.redirect(destination),
        );
      },
    );
  });
  app.get("/logout", (req, res, next) =>
    req.logout((error) => (error ? next(error) : res.redirect("/"))),
  );

  app.get(
    "/api/catalog",
    asyncRoute(async (req, res) => {
      const query = String(req.query.q || "")
        .trim()
        .slice(0, 200);
      const page = Math.min(
        500,
        Math.max(1, parseInt(req.query.page, 10) || 1),
      );
      const data = await tmdb(
        query ? "search/movie" : "movie/now_playing",
        query ? { query, page, include_adult: "false" } : { page },
      );
      res
        .set("Cache-Control", "public, max-age=120")
        .json({
          films: data.results.map(filmData),
          pages: Math.min(data.total_pages, 500),
        });
    }),
  );
  app.get(
    "/api/films/:id",
    asyncRoute(async (req, res) => {
      const id = movieId(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid film." });
      res
        .set("Cache-Control", "public, max-age=300")
        .json(
          filmData(
            await tmdb("movie/" + id, { append_to_response: "credits,videos" }),
          ),
        );
    }),
  );
  // Existing shared-list API clients still receive the original document fields.
  app.get(
    "/api/user-movie-data",
    asyncRoute(async (req, res) => {
      if (!mongoose.isObjectIdOrHexString(req.query.userId))
        return res.status(400).json({ message: "Invalid user ID." });
      const owner = await User.findById(req.query.userId).select("movieIds");
      res.json(owner?.movieIds || []);
    }),
  );
  app.post(
    "/save-movie-score",
    requireApiUser,
    asyncRoute(async (req, res) => {
      const { title, score, imgURL, year, genres } = req.body;
      const id = movieId(req.body.movieId);
      const rating = score === "" || score == null ? null : Number(score);
      if (
        !id ||
        typeof title !== "string" ||
        !title.trim() ||
        (rating !== null &&
          (!Number.isInteger(rating) || rating < 1 || rating > 10))
      ) {
        return res.status(400).json({ message: "Invalid film or rating." });
      }
      const film = {
        movieId: id,
        score: rating,
        title: title.slice(0, 500),
        imgURL: allowedPoster(imgURL),
        year: String(year || "").slice(0, 4),
        genres:
          typeof genres === "string"
            ? genres.split("|").filter(Boolean).slice(0, 15)
            : [],
      };
      // One atomic update per user prevents duplicate entries when two saves overlap.
      const oldEntries = { $ifNull: ["$movieIds", []] };
      await User.updateOne({ _id: req.user._id }, [
        {
          $set: {
            movieIds: {
              $cond: [
                { $in: [id, { $ifNull: ["$movieIds.movieId", []] }] },
                {
                  $map: {
                    input: oldEntries,
                    as: "film",
                    in: {
                      $cond: [
                        { $eq: ["$$film.movieId", id] },
                        { $mergeObjects: ["$$film", { score: rating }] },
                        "$$film",
                      ],
                    },
                  },
                },
                {
                  $concatArrays: [
                    oldEntries,
                    {
                      $literal: [
                        { ...film, _id: new mongoose.Types.ObjectId() },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      ]);
      res.json({ message: "Score updated successfully" });
    }),
  );
  app.post(
    "/remove",
    requireApiUser,
    asyncRoute(async (req, res) => {
      const id = movieId(req.body.movieId);
      if (!id) return res.status(400).json({ message: "Invalid film." });
      await User.updateOne(
        { _id: req.user._id },
        { $pull: { movieIds: { movieId: id } } },
      );
      if (req.get("Accept") === "application/json")
        return res.json({ removed: id });
      res.redirect("/mylist");
    }),
  );
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || (error.name === "TimeoutError" ? 504 : 500);
    console.error("Request failed:", req.path, error.name, status);
    res
      .status(status)
      .json({
        message:
          status === 404
            ? "Film not found."
            : "This request could not be completed. Please try again.",
      });
  });
};
