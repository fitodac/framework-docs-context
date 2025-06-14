const fs = require("fs");
const path = require("path");
const simpleGit = require("simple-git");

const git = simpleGit();
const REPO_URL = "https://github.com/fitodac/framework-docs-context.git";
const LOCAL_DIR = path.resolve(__dirname, "repo");

function log(msg) {
  console.error("🔧", msg);
}

async function cloneOrUpdateRepo() {
  if (!fs.existsSync(LOCAL_DIR)) {
    log("Clonando repo...");
    await git.clone(REPO_URL, LOCAL_DIR);
  } else {
    log("Actualizando repo...");
    await git.cwd(LOCAL_DIR).pull();
  }
}

function* walkMdFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkMdFiles(res);
    } else if (entry.name.endsWith(".md")) {
      const content = fs.readFileSync(res, "utf8");
      yield {
        path: path.relative(LOCAL_DIR, res),
        content,
      };
    }
  }
}

(async () => {
  try {
    log("Iniciando MCP...");
    await cloneOrUpdateRepo();

    let count = 0;
    for (const file of walkMdFiles(LOCAL_DIR)) {
      console.log(JSON.stringify(file));
      count++;
    }

    if (count === 0) {
      log("⚠️ No se encontraron archivos .md para enviar.");
    } else {
      log(`✅ Enviados ${count} archivos.`);
    }
  } catch (err) {
    log("❌ Error: " + err.message);
    process.exit(1);
  }
})();