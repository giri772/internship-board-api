
const express = require("express");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "100kb" }));

const allowedFields = [
  "title",
  "company",
  "location",
  "type",
  "stipend",
  "description",
  "applyUrl"
];

const validTypes = ["Remote", "Hybrid", "On-site"];

function sendError(res, status, code, message) {
  return res.status(status).json({
    success: false,
    error: { code, message }
  });
}

function validateInternship(body, partial = false) {
  const errors = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return ["Request body must be a JSON object."];
  }

  const unknownFields = Object.keys(body).filter(
    (key) => !allowedFields.includes(key)
  );

  if (unknownFields.length) {
    errors.push(
      `Unknown fields: ${unknownFields.join(", ")}`
    );
  }

  const fields = partial
    ? Object.keys(body).filter((key) => allowedFields.includes(key))
    : allowedFields;

  if (partial && fields.length === 0) {
    errors.push("Provide at least one valid field to update.");
  }

  for (const field of fields) {
    const value = body[field];

    if (value === undefined) {
      if (!partial) {
        errors.push(`${field} is required.`);
      }
      continue;
    }

    if (["title", "company", "location", "description", "applyUrl"].includes(field)) {
      if (typeof value !== "string" || !value.trim()) {
        errors.push(`${field} must be a non-empty string.`);
      } else if (value.trim().length > (field === "description" ? 2000 : 300)) {
        errors.push(`${field} is too long.`);
      }
    }

    if (field === "type" && !validTypes.includes(value)) {
      errors.push("type must be Remote, Hybrid, or On-site.");
    }

    if (field === "stipend" &&
        (!Number.isSafeInteger(value) || value < 0)) {
      errors.push("stipend must be a non-negative integer.");
    }

    if (field === "applyUrl" && typeof value === "string" && value.trim()) {
      try {
        const url = new URL(value.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          errors.push("applyUrl must use HTTP or HTTPS.");
        }
      } catch {
        errors.push("applyUrl must be a valid URL.");
      }
    }
  }

  return errors;
}

function cleanInput(body) {
  const result = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      result[field] =
        typeof body[field] === "string"
          ? body[field].trim()
          : body[field];
    }
  }

  return result;
}

function getId(value) {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}
// API homepage
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Internship Board REST API",
    endpoints: {
      health: "/api/health",
      internships: "/api/internships"
    }
  });
});


// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Internship Board API is running."
  });
});

// List internships with search and pagination
app.get("/api/internships", (req, res) => {
  const page = req.query.page === undefined
    ? 1 : Number(req.query.page);

  const limit = req.query.limit === undefined
    ? 10 : Number(req.query.limit);

  if (!Number.isSafeInteger(page) || page < 1) {
    return sendError(res, 400, "INVALID_PAGE",
      "page must be a positive integer.");
  }

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    return sendError(res, 400, "INVALID_LIMIT",
      "limit must be an integer between 1 and 100.");
  }

  const search = typeof req.query.search === "string"
    ? req.query.search.trim() : "";

  if (search.length > 100) {
    return sendError(res, 400, "INVALID_SEARCH",
      "search cannot exceed 100 characters.");
  }

  const where = search
    ? `WHERE title LIKE @search
       OR company LIKE @search
       OR location LIKE @search`
    : "";

  const parameters = search
    ? { search: `%${search}%` } : {};

  const total = db.prepare(
    `SELECT COUNT(*) AS total FROM internships ${where}`
  ).get(parameters).total;

  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset)) {
    return sendError(res, 400, "INVALID_PAGE",
      "Requested page is too large.");
  }

  const items = db.prepare(`
    SELECT * FROM internships
    ${where}
    ORDER BY id DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...parameters, limit, offset });

  res.json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });
});

// Get one internship
app.get("/api/internships/:id", (req, res) => {
  const id = getId(req.params.id);

  if (id === null) {
    return sendError(res, 400, "INVALID_ID",
      "ID must be a positive integer.");
  }

  const item = db.prepare(
    "SELECT * FROM internships WHERE id = ?"
  ).get(id);

  if (!item) {
    return sendError(res, 404, "NOT_FOUND",
      "Internship not found.");
  }

  res.json({ success: true, data: item });
});

// Create internship
app.post("/api/internships", (req, res) => {
  const errors = validateInternship(req.body);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the submitted data.",
        details: errors
      }
    });
  }

  const item = cleanInput(req.body);

  const result = db.prepare(`
    INSERT INTO internships (
      title, company, location, type,
      stipend, description, applyUrl
    ) VALUES (
      @title, @company, @location, @type,
      @stipend, @description, @applyUrl
    )
  `).run({
    stipend: 0,
    ...item
  });

  const created = db.prepare(
    "SELECT * FROM internships WHERE id = ?"
  ).get(result.lastInsertRowid);

  res.status(201).json({
    success: true,
    message: "Internship created successfully.",
    data: created
  });
});

// Update internship (PUT accepts partial updates here)
app.put("/api/internships/:id", (req, res) => {
  const id = getId(req.params.id);

  if (id === null) {
    return sendError(res, 400, "INVALID_ID",
      "ID must be a positive integer.");
  }

  const existing = db.prepare(
    "SELECT * FROM internships WHERE id = ?"
  ).get(id);

  if (!existing) {
    return sendError(res, 404, "NOT_FOUND",
      "Internship not found.");
  }

  const errors = validateInternship(req.body, true);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the submitted data.",
        details: errors
      }
    });
  }

  const updates = cleanInput(req.body);
  const merged = { ...existing, ...updates };

  const mergedErrors = validateInternship({
    title: merged.title,
    company: merged.company,
    location: merged.location,
    type: merged.type,
    stipend: merged.stipend,
    description: merged.description,
    applyUrl: merged.applyUrl
  });

  if (mergedErrors.length) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Updated internship is invalid.",
        details: mergedErrors
      }
    });
  }

  const fields = Object.keys(updates);

  const setClause = fields
    .map((field) => `${field} = @${field}`)
    .concat("updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
    .join(", ");

  db.prepare(
    `UPDATE internships SET ${setClause} WHERE id = @id`
  ).run({ ...updates, id });

  const updated = db.prepare(
    "SELECT * FROM internships WHERE id = ?"
  ).get(id);

  res.json({
    success: true,
    message: "Internship updated successfully.",
    data: updated
  });
});

// Delete internship
app.delete("/api/internships/:id", (req, res) => {
  const id = getId(req.params.id);

  if (id === null) {
    return sendError(res, 400, "INVALID_ID",
      "ID must be a positive integer.");
  }

  const result = db.prepare(
    "DELETE FROM internships WHERE id = ?"
  ).run(id);

  if (result.changes === 0) {
    return sendError(res, 404, "NOT_FOUND",
      "Internship not found.");
  }

  res.json({
    success: true,
    message: "Internship deleted successfully."
  });
});

// Malformed JSON and other body-parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendError(res, 400, "INVALID_JSON",
      "Request body contains invalid JSON.");
  }

  if (err.type === "entity.too.large") {
    return sendError(res, 413, "BODY_TOO_LARGE",
      "Request body must not exceed 100 KB.");
  }

  next(err);
});

// Unknown endpoints
app.use((req, res) => {
  sendError(res, 404, "ROUTE_NOT_FOUND",
    "The requested API endpoint does not exist.");
});

// Unexpected server errors
app.use((err, req, res, next) => {
  console.error(err);
  sendError(res, 500, "INTERNAL_SERVER_ERROR",
    "An unexpected server error occurred.");
});

app.listen(PORT, () => {
  console.log(`Internship Board API running at http://localhost:${PORT}`);
});
