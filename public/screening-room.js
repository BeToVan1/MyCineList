"use strict";
const $ = (id) => document.getElementById(id);
const shapes = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14m10-14v14M3 10h4m-4 4h4m10-4h4m-4 4h4"/>',
  save: '<path d="M6 5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v15l-6-4-6 4z"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  prev: '<path d="m14 6-6 6 6 6"/>',
  next: '<path d="m9 6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
const icon = (key) =>
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' +
  shapes[key] +
  "</svg>";
const safe = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const state = JSON.parse($("initial-state").textContent);
const byId = new Map();
const detailsLoaded = new Set();
const curated = films.map((f) => ({
  ...f,
  poster: "/" + f.poster,
  backdrop: f.backdrop ? "/" + f.backdrop : "",
}));
for (const film of curated) {
  byId.set(film.id, film);
  detailsLoaded.add(film.id);
}
const spotlight = [335984, 120467, 157336];
const emptyFilm = {
  year: "",
  genres: [],
  score: null,
  cast: [],
  director: "",
  runtime: "",
  synopsis: "",
  poster: "",
};
function registerSaved(entries) {
  for (const entry of entries) {
    if (!byId.has(entry.id)) byId.set(entry.id, { ...emptyFilm, ...entry });
  }
}
let library = state.library;
registerSaved(library);
registerSaved(state.entries || []);
let slide = 0,
  genre = "All films",
  limit = 5,
  sort = state.sort || "recent",
  timer,
  selected = null,
  opener = null;
let collection = "curated",
  remote = [],
  currentPage = 0,
  lastPage = 0,
  lookup,
  searchTimer,
  loading = false,
  catalogError = "";
const busy = new Set();
function notify(message) {
  $("toast").textContent = message;
  clearTimeout(timer);
  timer = setTimeout(() => {
    $("toast").textContent = "";
  }, 2400);
}
function saved(id) {
  return library.find((entry) => entry.id === id);
}
const titleParts = {
  335984: ["Blade Runner", "2049"],
  120467: ["The Grand", "Budapest Hotel"],
  157336: ["Interstellar", ""],
};
function drawFeature() {
  const f = byId.get(spotlight[slide]),
    [first, last] = titleParts[f.id];
  $("still").src = f.backdrop;
  $("still").alt = "";
  $("feature-title").innerHTML =
    safe(first) + (last ? " <em>" + safe(last) + "</em>" : "");
  $("feature-meta").innerHTML = [
    f.year,
    f.runtime,
    f.genres.slice(0, 2).join(" / "),
  ]
    .map(safe)
    .join('<b aria-hidden="true"></b>');
  $("feature-summary").textContent = f.synopsis;
  $("feature-save").innerHTML =
    icon(saved(f.id) ? "check" : "plus") +
    (saved(f.id) ? "In my list" : "My list");
  $("feature-save").setAttribute("aria-pressed", String(!!saved(f.id)));
  $("slide-index").innerHTML =
    String(slide + 1).padStart(2, "0") + " <em>/ 03</em>";
}

function requireAccount(id) {
  if (state.userId) return true;
  location.href = "/login?film=" + encodeURIComponent(id);
  return false;
}
async function changeLibrary(id, rating, remove = false) {
  if (!(await sessionReady)) {
    notify("Could not load your account. Reload the page to try again.");
    return;
  }
  if (!requireAccount(id) || busy.has(id)) return;
  const f = byId.get(id);
  busy.add(id);
  try {
    const response = await fetch(remove ? "/remove" : "/save-movie-score", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams({
        movieId: id,
        score: rating ?? "",
        title: f.title,
        imgURL: f.poster || "",
        year: f.year || "",
        genres: f.genres.join("|"),
      }),
    });
    if (response.status === 401) {
      location.href = "/login?film=" + id;
      return;
    }
    if (!response.ok) throw new Error("Save failed");
    if (remove) library = library.filter((item) => item.id !== id);
    else if (saved(id)) saved(id).rating = rating;
    else library.push({ id, rating });
    notify(
      remove
        ? "Removed from my list"
        : rating
          ? "Rating saved"
          : "Added to my list",
    );
  } catch {
    notify("Could not save the change. Please try again.");
  } finally {
    busy.delete(id);
    render();
    if (selected === id && $("detail").open) drawDetail(id);
  }
}
async function toggle(id) {
  await sessionReady;
  if (busy.has(id)) return;
  const entry = saved(id);
  if (entry) {
    const dialog = $("confirm-remove");
    if (dialog.open) return;
    const title = byId.get(id).title;
    $("remove-message").textContent = entry.rating
      ? `Removing “${title}” will also delete your ${entry.rating}/10 rating.`
      : `“${title}” will be removed from your list.`;
    dialog.returnValue = "";
    const closed = new Promise((resolve) =>
      dialog.addEventListener("close", resolve, { once: true }),
    );
    dialog.showModal();
    await closed;
    if (dialog.returnValue !== "remove") return;
  }
  return changeLibrary(id, null, Boolean(entry));
}
function setRating(id, value) {
  return changeLibrary(id, value ? Number(value) : null);
}
function poster(f) {
  return f.poster
    ? '<img loading="lazy" width="400" height="600" src="' +
        safe(f.poster) +
        '" alt="">'
    : '<span class="no-poster">' + safe(f.title) + "</span>";
}
function card(f, entry, isShared) {
  const isSaved = !!saved(f.id);
  return (
    '<article class="card"><div class="poster"><a href="/moviepage?movie_id=' +
    f.id +
    '" data-film="' +
    f.id +
    '" aria-label="View ' +
    safe(f.title) +
    '">' +
    poster(f) +
    "</a>" +
    '<button class="bookmark ' +
    (isSaved ? "saved" : "") +
    '" data-save="' +
    f.id +
    '" aria-label="' +
    (isSaved ? "Remove " : "Save ") +
    safe(f.title) +
    (isSaved ? " from" : " to") +
    ' my list" aria-pressed="' +
    isSaved +
    '">' +
    icon(isSaved ? "check" : "save") +
    "</button></div>" +
    '<h3><a href="/moviepage?movie_id=' +
    f.id +
    '" data-film="' +
    f.id +
    '">' +
    safe(f.title) +
    '</a></h3><div class="card-meta"><span>' +
    [f.year, f.genres[0]].filter(Boolean).map(safe).join(" · ") +
    '</span><span class="score" title="' +
    (entry?.rating
      ? isShared
        ? "Shared list rating"
        : "Your rating"
      : "TMDB community score") +
    '"><span class="star" aria-hidden="true">★</span> ' +
    (entry?.rating
      ? entry.rating + "/10"
      : f.score
        ? f.score.toFixed(1)
        : "—") +
    "</span></div></article>"
  );
}

function deduplicate(items) {
  return [...new Map(items.map((f) => [f.id, f])).values()];
}
function loadCatalog(page = 1) {
  clearTimeout(searchTimer);
  lookup?.abort();
  const request = new AbortController();
  lookup = request;
  const q = $("query").value.trim();
  if (page === 1) {
    remote = [];
    lastPage = 0;
    currentPage = 0;
  }
  catalogError = "";
  loading = true;
  render();
  searchTimer = setTimeout(
    async () => {
      try {
        const response = await fetch(
          "/api/catalog?" + new URLSearchParams({ q, page }),
          { signal: request.signal },
        );
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (request !== lookup) return;
        data.films.forEach((f) => {
          if (!detailsLoaded.has(f.id)) byId.set(f.id, f);
        });
        remote = deduplicate([
          ...remote,
          ...data.films.map((f) => byId.get(f.id)),
        ]);
        currentPage = page;
        lastPage = data.pages;
      } catch {
        if (!request.signal.aborted)
          catalogError = "Live movie data could not be loaded.";
      } finally {
        if (request === lookup) {
          loading = false;
          render();
        }
      }
    },
    q && page === 1 ? 220 : 0,
  );
}
function updateCatalog() {
  if (
    state.page === "discover" &&
    ($("query").value.trim() || collection === "now")
  )
    return loadCatalog();
  clearTimeout(searchTimer);
  lookup?.abort();
  lookup = null;
  remote = [];
  loading = false;
  catalogError = "";
  render();
}
function render() {
  const page = state.page,
    query = $("query").value.trim().toLowerCase(),
    isList = page !== "discover",
    searching = Boolean(query);
  $("feature").hidden = isList || searching;
  const activeNav =
    isList && page === "list" ? "nav-list" : !isList ? "nav-discover" : null;
  for (const el of document.querySelectorAll("nav a")) {
    if (el.id === activeNav) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  }
  $("list-count").textContent = library.length;
  const activeList = page === "shared" ? state.entries : library;
  let pool;
  if (isList) {
    pool = activeList.map((entry) => byId.get(entry.id));
    if (searching)
      pool = pool.filter((f) => f.title.toLowerCase().includes(query));
  } else if (searching) {
    const matches = curated.filter((f) =>
      [f.title, f.director, ...f.cast].some((v) =>
        v.toLowerCase().includes(query),
      ),
    );
    pool = deduplicate([...remote, ...matches]);
  } else pool = collection === "now" ? remote : curated;
  const options = [
    "All films",
    ...[
      "Sci-Fi",
      "Drama",
      "Comedy",
      "Thriller",
      "Animation",
      "Romance",
      "Horror",
    ].filter((g) => pool.some((f) => f.genres.includes(g))),
  ];
  if (!options.includes(genre)) genre = "All films";
  $("genres").innerHTML = options
    .map(
      (g) =>
        '<button class="chip" data-genre="' +
        safe(g) +
        '" aria-pressed="' +
        (g === genre) +
        '">' +
        safe(g) +
        "</button>",
    )
    .join("");
  let items = pool.filter(
    (f) => genre === "All films" || f.genres.includes(genre),
  );
  if (isList && sort.startsWith("title"))
    items.sort(
      (a, b) => a.title.localeCompare(b.title) * (sort === "title" ? 1 : -1),
    );
  if (isList && sort.startsWith("rating")) {
    const ratings = new Map(activeList.map((x) => [x.id, x.rating || 0]));
    items.sort(
      (a, b) =>
        (ratings.get(b.id) - ratings.get(a.id)) * (sort === "rating" ? 1 : -1),
    );
  }
  const title = searching
    ? "Search results"
    : page === "list"
      ? "My list"
      : page === "shared"
        ? "Shared list"
        : collection === "now"
          ? "Now playing"
          : "The film shelf";
  document.title = (isList || searching ? title : "Discover") + " · MyCineList";
  $("shelf-title").innerHTML = title + "<span>.</span>";
  $("section-kicker").innerHTML =
    "<i></i>" +
    (isList
      ? "Film collection"
      : searching
        ? "Discovery"
        : "Curated discovery");
  $("shelf-tools").innerHTML = isList
    ? '<div class="list-tools"><select class="sort" id="sort" aria-label="Sort list"><option value="recent">List order</option><option value="title">Title A–Z</option><option value="title-desc">Title Z–A</option><option value="rating">Highest rated</option><option value="rating-asc">Lowest rated</option></select>' +
      (page === "list" && library.length
        ? '<button id="share" class="button">Share list</button>'
        : "") +
      "</div>"
    : !searching
      ? '<div class="shelf-switch"><button data-collection="curated" aria-pressed="' +
        (collection === "curated") +
        '">Curated</button><button data-collection="now" aria-pressed="' +
        (collection === "now") +
        '">Now playing</button></div>'
      : "";
  if ($("sort")) $("sort").value = sort;
  const shown =
    isList || searching || collection === "now" ? items : items.slice(0, limit);
  $("result-count").textContent =
    items.length + " film" + (items.length === 1 ? "" : "s");
  $("grid").innerHTML = shown
    .map((f) =>
      card(
        f,
        isList ? activeList.find((x) => x.id === f.id) : null,
        page === "shared",
      ),
    )
    .join("");
  const remoteMode = !isList && (searching || collection === "now");
  $("more").hidden = remoteMode
    ? currentPage >= lastPage || loading
    : shown.length >= items.length;
  $("catalog-status").textContent = loading ? "Loading films…" : catalogError;
  $("retry").hidden = !catalogError;
  $("empty").hidden = items.length > 0 || loading || Boolean(catalogError);
  $("empty").innerHTML = searching
    ? '<strong>No matching films</strong><p>Try another title, director, or cast member.</p><button class="text-link" id="clear">Clear search</button>'
    : page === "list" && !library.length
      ? '<strong>Your list is ready for its first film.</strong><p>Save a poster from Discover to start your collection.</p><a href="/" class="text-link">Discover films</a>'
      : "<strong>No films to show.</strong>";
  drawFeature();
}
function drawDetail(id, focus) {
  const f = byId.get(id),
    entry = saved(id);
  selected = id;
  $("detail-content").innerHTML =
    '<button class="close" aria-label="Close film details" data-close>' +
    icon("close") +
    '</button><div class="detail-body"><img src="' +
    safe(f.poster) +
    '" alt="' +
    safe(f.title) +
    ' poster" ' +
    (f.poster ? "" : "hidden") +
    '><div><div class="kicker"><i></i> Film details</div><h2 id="detail-title">' +
    safe(f.title) +
    "</h2>" +
    '<div class="metadata">' +
    [f.year, f.runtime, f.genres.join(" / ")]
      .filter(Boolean)
      .map(safe)
      .join(" · ") +
    "</div><p>" +
    safe(f.synopsis) +
    '</p><div class="credits"><b>Directed by</b> ' +
    safe(f.director || "Unavailable") +
    '</div><div class="credits"><b>Starring</b> ' +
    safe(f.cast.join(", ") || "Unavailable") +
    '</div><div class="credits"><b>TMDB score</b> ' +
    (f.score ? f.score.toFixed(1) : "—") +
    " / 10</div>" +
    '<label class="rate">Your rating <select id="rating" class="sort"><option value="">Unrated</option>' +
    Array.from(
      { length: 10 },
      (_, i) => '<option value="' + (i + 1) + '">' + (i + 1) + " / 10</option>",
    ).join("") +
    '</select></label><div class="actions"><button id="detail-save" class="button red">' +
    icon(entry ? "check" : "plus") +
    (entry ? "Remove from list" : "Add to my list") +
    "</button>" +
    (f.trailer
      ? '<a class="button outline" target="_blank" rel="noreferrer" href="https://www.youtube.com/watch?v=' +
        encodeURIComponent(f.trailer) +
        '">Watch trailer</a>'
      : "") +
    "</div></div></div>";
  $("rating").value = entry?.rating || "";
  if (focus) $(focus)?.focus();
}

let detailRequest;
async function openDetail(id) {
  opener = document.activeElement;
  selected = id;
  detailRequest?.abort();
  if (!$("detail").open) $("detail").showModal();
  if (detailsLoaded.has(id)) {
    drawDetail(id);
    $("detail").querySelector("[data-close]").focus();
    return;
  }
  $("detail-content").innerHTML =
    '<div class="share-box"><button class="close" data-close aria-label="Close film details">' +
    icon("close") +
    '</button><h2 id="detail-title">Film details</h2><p role="status">Loading film…</p></div>';
  const request = new AbortController();
  detailRequest = request;
  try {
    const response = await fetch("/api/films/" + id, {
      signal: request.signal,
    });
    if (!response.ok) throw new Error();
    const f = await response.json();
    byId.set(id, f);
    detailsLoaded.add(id);
    if (selected === id && $("detail").open) {
      drawDetail(id);
      $("detail").querySelector("[data-close]").focus();
    }
  } catch {
    if (request.signal.aborted || selected !== id) return;
    if (byId.has(id)) {
      drawDetail(id);
      notify("Some movie details are unavailable.");
    } else
      $("detail-content").querySelector("[role=status]").textContent =
        "This film could not be loaded. Close and try again.";
  }
}
function share() {
  const url = new URL("/list/" + state.userId, location.origin);
  opener = document.activeElement;
  selected = null;
  $("detail-content").innerHTML =
    '<div class="share-box"><button class="close" data-close aria-label="Close">' +
    icon("close") +
    '</button><h2 id="detail-title">Share my list</h2><p>Anyone with this link can see the films and ratings in your list.</p><label>List link<input readonly id="share-url"></label><p><button id="copy" class="button red">Copy link</button></p><span id="copy-status" role="status"></span></div>';
  $("share-url").value = url.href;
  $("detail").showModal();
}
document.querySelectorAll("[data-icon]").forEach((el) => {
  el.innerHTML = icon(el.dataset.icon);
});
$("feature-open").onclick = () => openDetail(spotlight[slide]);
$("feature-save").onclick = () => toggle(spotlight[slide]);
function changeSlide(n) {
  slide = (slide + n + spotlight.length) % spotlight.length;
  drawFeature();
}
$("prev").onclick = () => changeSlide(-1);
$("next").onclick = () => changeSlide(1);

$("more").onclick = () => {
  if ($("query").value.trim() || collection === "now") {
    loadCatalog(currentPage + 1);
    return;
  }
  const last = $("grid").children.length;
  limit += 5;
  render();
  $("grid").children[last]?.querySelector("a")?.focus();
};
$("retry").onclick = () => loadCatalog(currentPage + 1);
$("query").oninput = () => {
  genre = "All films";
  limit = 5;
  updateCatalog();
};
$("query").closest("form").onsubmit = (e) => {
  e.preventDefault();
  updateCatalog();
};
document.addEventListener("click", async (event) => {
  const t = event.target.closest("button,a");
  if (!t) return;
  if (t.dataset.collection) {
    collection = t.dataset.collection;
    genre = "All films";
    limit = 5;
    updateCatalog();
    return;
  }
  if (t.dataset.genre) {
    genre = t.dataset.genre;
    limit = 5;
    render();
    [...$("genres").children].find((el) => el.dataset.genre === genre)?.focus();
  } else if (t.dataset.film) {
    event.preventDefault();
    openDetail(Number(t.dataset.film));
  } else if (t.dataset.save) {
    const id = Number(t.dataset.save);
    await toggle(id);
    document.querySelector('[data-save="' + id + '"]')?.focus();
  } else if (t.id === "detail-save") toggle(selected);
  else if (t.hasAttribute("data-close")) $("detail").close();
  else if (t.id === "share") share();
  else if (t.id === "copy") {
    try {
      await navigator.clipboard.writeText($("share-url").value);
      $("copy-status").textContent = "Link copied.";
    } catch {
      $("share-url").select();
      $("copy-status").textContent = "Select and copy the link above.";
    }
  } else if (t.id === "clear") {
    $("query").value = "";
    updateCatalog();
    $("query").focus();
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "rating") setRating(selected, e.target.value);
  if (e.target.id === "sort") {
    sort = e.target.value;
    render();
    $("sort").focus();
  }
});
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !document.querySelector("dialog[open]") &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
  ) {
    e.preventDefault();
    $("query").focus();
  }
});
$("detail").addEventListener("click", (e) => {
  if (e.target === $("detail")) $("detail").close();
});

$("detail").addEventListener("close", () => {
  detailRequest?.abort();
  if (opener?.isConnected) opener.focus({ preventScroll: true });
  else if (selected)
    document
      .querySelector('[data-film="' + selected + '"]')
      ?.focus({ preventScroll: true });
  selected = null;
});
async function loadSession() {
  try {
    const response = await fetch("/api/session", { cache: "no-store" });
    if (!response.ok) return false;
    const account = await response.json();
    state.userId = account.userId;
    library = account.library;
    registerSaved(library);
    const link = document.querySelector(".account-link");
    link.href = account.userId ? "/logout" : "/login";
    link.textContent = account.userId ? "Sign out" : "Sign in";
    render();
    if (selected && $("detail").open && detailsLoaded.has(selected)) drawDetail(selected);
    return true;
  } catch {
    return false;
  }
}
const sessionReady = state.staticDiscover ? loadSession() : Promise.resolve(true);
$("query").value = state.staticDiscover
  ? (new URLSearchParams(location.search).get("q") || "").slice(0, 200)
  : state.query;
updateCatalog();
if (state.filmId) openDetail(state.filmId);
