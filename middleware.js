import jwt from "jsonwebtoken";
import { SECRET_JWT_KEY } from "./config.js";
import { wantsJson, sendError } from "./helpers.js";

// Es executa a TOTES les peticions: llegeix el token (cookie o capçalera
// Authorization: Bearer <token>) i carrega l'usuari a req.session.user
export function loadUser(req, res, next) {
    const header = req.headers.authorization;
    const token =
        req.cookies?.access_token ??
        (header?.startsWith("Bearer ") ? header.slice(7) : undefined);

    req.session = { user: null };
    try {
        req.session.user = jwt.verify(token, SECRET_JWT_KEY);
    } catch (error) {
        req.session.user = null; // sense token, token invàlid o caducat
    }
    res.locals.user = req.session.user; // disponible a totes les plantilles EJS
    next();
}

// Autenticació: si no hi ha usuari -> 401 (API) o redirecció al login (navegador)
export function requireAuth(req, res, next) {
    if (!req.session.user) {
        if (wantsJson(req)) {
            return res.status(401).json({ error: "No autenticat" });
        }
        return res.redirect("/login");
    }
    next();
}

// Autorització: només administradors -> 403 Forbidden
export function requireAdmin(req, res, next) {
    if (req.session.user.role !== "admin") {
        return sendError(req, res, 403, "Accés només per a administradors");
    }
    next();
}
