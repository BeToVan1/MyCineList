const fs = require("node:fs/promises");
const path = require("node:path");
const ejs = require("ejs");

async function buildDiscover() {
  const root = path.resolve(__dirname, "..");
  const dist = path.join(root, "dist");
  const state = {
    page: "discover",
    query: "",
    userId: null,
    library: [],
    staticDiscover: true,
  };
  const html = await ejs.renderFile(path.join(root, "views/screening-room.ejs"), {
    pageTitle: "Discover",
    state,
  });
  await fs.cp(path.join(root, "public"), dist, { recursive: true });
  await fs.writeFile(path.join(dist, "index.html"), html);
}

buildDiscover().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
