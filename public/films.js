const films = [
  {
    "id": 693134,
    "title": "Dune: Part Two",
    "year": "2024",
    "runtime": "2h 47m",
    "genres": [
      "Sci-Fi",
      "Adventure"
    ],
    "director": "Denis Villeneuve",
    "synopsis": "Paul Atreides joins the Fremen as a holy war looms over Arrakis.",
    "score": 8.1,
    "poster": "assets/693134.webp",
    "cast": [
      "Timothée Chalamet",
      "Zendaya",
      "Rebecca Ferguson",
      "Javier Bardem"
    ],
    "trailer": "U2Qp5pL3ovA"
  },
  {
    "id": 120467,
    "title": "The Grand Budapest Hotel",
    "year": "2014",
    "runtime": "1h 40m",
    "genres": [
      "Comedy",
      "Drama"
    ],
    "director": "Wes Anderson",
    "synopsis": "A concierge and his young lobby boy become entangled in an art theft at a mountaintop hotel.",
    "score": 8.0,
    "poster": "assets/120467.webp",
    "cast": [
      "Ralph Fiennes",
      "F. Murray Abraham",
      "Tony Revolori",
      "Adrien Brody"
    ],
    "trailer": "G1jG8HUY4zI",
    "backdrop": "assets/120467-wide.webp"
  },
  {
    "id": 496243,
    "title": "Parasite",
    "year": "2019",
    "runtime": "2h 13m",
    "genres": [
      "Comedy",
      "Thriller",
      "Drama"
    ],
    "director": "Bong Joon Ho",
    "synopsis": "Two families in Seoul find their lives entwined when a tutor steps through the door of a wealthy home.",
    "score": 8.5,
    "poster": "assets/496243.webp",
    "cast": [
      "Song Kang-ho",
      "Lee Sun-kyun",
      "Cho Yeo-jeong",
      "Choi Woo-shik"
    ],
    "trailer": "bM9QabAojCg"
  },
  {
    "id": 157336,
    "title": "Interstellar",
    "year": "2014",
    "runtime": "2h 49m",
    "genres": [
      "Adventure",
      "Drama",
      "Sci-Fi"
    ],
    "director": "Christopher Nolan",
    "synopsis": "A team of astronauts crosses a wormhole in search of a future for humanity.",
    "score": 8.5,
    "poster": "assets/157336.webp",
    "cast": [
      "Matthew McConaughey",
      "Anne Hathaway",
      "Michael Caine",
      "Jessica Chastain"
    ],
    "trailer": "LY19rHKAaAg",
    "backdrop": "assets/157336-wide.webp"
  },
  {
    "id": 129,
    "title": "Spirited Away",
    "year": "2001",
    "runtime": "2h 5m",
    "genres": [
      "Animation",
      "Family",
      "Fantasy",
      "Adventure"
    ],
    "director": "Hayao Miyazaki",
    "synopsis": "Chihiro must find her way through a bathhouse for spirits to bring her parents home.",
    "score": 8.5,
    "poster": "assets/129.webp",
    "cast": [
      "Rumi Hiiragi",
      "Miyu Irino",
      "Mari Natsuki",
      "Takashi Naito"
    ],
    "trailer": "GAp2_0JJskk"
  },
  {
    "id": 335984,
    "title": "Blade Runner 2049",
    "year": "2017",
    "runtime": "2h 44m",
    "genres": [
      "Sci-Fi",
      "Drama"
    ],
    "director": "Denis Villeneuve",
    "synopsis": "A buried secret sends a young blade runner across a fractured Los Angeles in search of the man who vanished thirty years ago.",
    "score": 7.6,
    "poster": "assets/335984.webp",
    "cast": [
      "Ryan Gosling",
      "Harrison Ford",
      "Ana de Armas",
      "Dave Bautista"
    ],
    "trailer": "geFtxCSz8xI",
    "backdrop": "assets/335984-wide.webp"
  },
  {
    "id": 152532,
    "title": "Dallas Buyers Club",
    "year": "2013",
    "runtime": "1h 57m",
    "genres": [
      "Drama",
      "History"
    ],
    "director": "Jean-Marc Vallée",
    "synopsis": "In 1980s Dallas, Ron Woodroof starts a buyers club that brings treatment to people living with HIV.",
    "score": 7.9,
    "poster": "assets/152532.webp",
    "cast": [
      "Matthew McConaughey",
      "Jennifer Garner",
      "Jared Leto",
      "Denis O'Hare"
    ],
    "trailer": "KDvPcBeOn8E"
  },
  {
    "id": 376867,
    "title": "Moonlight",
    "year": "2016",
    "runtime": "1h 52m",
    "genres": [
      "Drama"
    ],
    "director": "Barry Jenkins",
    "synopsis": "Three chapters trace Chiron’s childhood, adolescence, and adulthood in Miami.",
    "score": 7.4,
    "poster": "assets/376867.webp",
    "cast": [
      "Trevante Rhodes",
      "André Holland",
      "Janelle Monáe",
      "Ashton Sanders"
    ],
    "trailer": "9NJj12tJzqc"
  },
  {
    "id": 11036,
    "title": "The Notebook",
    "year": "2004",
    "runtime": "2h 3m",
    "genres": [
      "Romance",
      "Drama"
    ],
    "director": "Nick Cassavetes",
    "synopsis": "A love that begins over a summer in South Carolina echoes across decades.",
    "score": 7.9,
    "poster": "assets/11036.webp",
    "cast": [
      "Ryan Gosling",
      "Rachel McAdams",
      "Gena Rowlands",
      "James Garner"
    ],
    "trailer": "FC6biTjEyZw"
  },
  {
    "id": 105,
    "title": "Back to the Future",
    "year": "1985",
    "runtime": "1h 56m",
    "genres": [
      "Adventure",
      "Comedy",
      "Sci-Fi"
    ],
    "director": "Robert Zemeckis",
    "synopsis": "A teenager lands in 1955 and has to bring his parents together before he can return home.",
    "score": 8.3,
    "poster": "assets/105.webp",
    "cast": [
      "Michael J. Fox",
      "Christopher Lloyd",
      "Crispin Glover",
      "Lea Thompson"
    ],
    "trailer": "ez6WQ7IX72U"
  },
  {
    "id": 194,
    "title": "Amélie",
    "year": "2001",
    "runtime": "2h 2m",
    "genres": [
      "Comedy",
      "Romance"
    ],
    "director": "Jean-Pierre Jeunet",
    "synopsis": "A Parisian waitress undertakes small, secret missions to change the lives of those around her.",
    "score": 7.9,
    "poster": "assets/194.webp",
    "cast": [
      "Audrey Tautou",
      "Mathieu Kassovitz",
      "Rufus",
      "Serge Merlin"
    ],
    "trailer": "555A7T_kmIc"
  },
  {
    "id": 530385,
    "title": "Midsommar",
    "year": "2019",
    "runtime": "2h 27m",
    "genres": [
      "Horror",
      "Drama",
      "Mystery"
    ],
    "director": "Ari Aster",
    "synopsis": "A trip to a Swedish midsummer festival turns unsettling for a group of American visitors.",
    "score": 7.1,
    "poster": "assets/530385.webp",
    "cast": [
      "Florence Pugh",
      "Jack Reynor",
      "William Jackson Harper",
      "Will Poulter"
    ],
    "trailer": "1Vnghdsjmd0"
  }
];
