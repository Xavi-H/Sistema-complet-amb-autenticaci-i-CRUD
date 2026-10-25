import fs from "node:fs";

// ---- Lectura i escriptura dels fitxers .json (la nostra "base de dades") ----
export const readJSON = (file) => JSON.parse(fs.readFileSync(file, "utf-8"));
export const writeJSON = (file, data) =>
    fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Crea un error amb un codi HTTP associat
export function httpError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// Diu si el client espera JSON (Postman / REST Client) o HTML (navegador)
export const wantsJson = (req) =>
    Boolean(req.is("json")) || req.accepts(["html", "json"]) === "json";

// Respon amb error: JSON per a l'API o una plantilla EJS per al navegador
export function sendError(req, res, status, message, view = "error", extra = {}) {
    if (wantsJson(req)) return res.status(status).json({ error: message });
    return res.status(status).render(view, { error: message, ...extra });
}
