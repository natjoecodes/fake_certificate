const KEY = "names";
const MAX_NAMES = 20;

const sanitizeName = (value) => {
  if (typeof value !== "string") return "";
  return value.replace(/[<>]/g, "").trim().slice(0, 60);
};

const dedupeAndTrim = (names) => {
  const seen = new Set();
  const output = [];

  for (const raw of names) {
    const name = sanitizeName(raw);
    if (!name) continue;
    const normalized = name.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(name);
    if (output.length >= MAX_NAMES) break;
  }

  return output;
};

const getVisitorsStore = async () => {
  const { getStore } = await import("@netlify/blobs");
  return getStore("prank-visitors");
};

const readNames = async (store) => {
  const saved = await store.get(KEY, { type: "json" });
  if (!Array.isArray(saved)) return [];
  return dedupeAndTrim(saved);
};

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  try {
    const store = await getVisitorsStore();

    if (event.httpMethod === "GET") {
      const names = await readNames(store);
      return json(200, { names });
    }

    if (event.httpMethod === "POST") {
      const parsed = event.body ? JSON.parse(event.body) : {};
      const newName = sanitizeName(parsed.name);
      if (!newName) return json(400, { error: "Name is required" });

      const existing = await readNames(store);
      const next = dedupeAndTrim([newName, ...existing]);
      await store.setJSON(KEY, next);
      return json(200, { names: next });
    }

    return json(405, { error: "Method not allowed" });
  } catch (error) {
    return json(500, {
      error: "Server error",
      detail: error && error.message ? error.message : String(error),
    });
  }
};
