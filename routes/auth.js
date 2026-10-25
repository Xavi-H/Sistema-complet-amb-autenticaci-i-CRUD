import { Router } from "express";
import jwt from "jsonwebtoken";
import { SECRET_JWT_KEY } from "../config.js";
import { UserRepository } from "../user-repository.js";
import { requireAuth } from "../middleware.js";
import { readJSON, wantsJson, httpError } from "../helpers.js";

const router = Router();

// Crea el JWT (caduca en 1 hora) i el guarda en una cookie segura
function setSession(res, user) {
    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET_JWT_KEY,
        { expiresIn: "1h" }
    );
    res.cookie("access_token", token, {
        httpOnly: true, // no accessible des de document.cookie
        secure: process.env.NODE_ENV === "production", // només https en producció
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 // 1 hora
    });
    return token;
}

router.get("/", (req, res) => {
    res.render("index");
});

router.get("/login", (req, res) => {
    if (req.session.user) return res.redirect("/protected");
    res.render("login");
});

router.post("/register", async (req, res) => {
    const { username, password, confirmPassword } = req.body ?? {};
    try {
        if (confirmPassword !== undefined && confirmPassword !== password) {
            throw httpError("Les contrasenyes no coincideixen");
        }
        const user = await UserRepository.create({ username, password });
        const token = setSession(res, user);
        if (wantsJson(req)) return res.status(201).json({ user, token });
        res.redirect("/protected");
    } catch (error) {
        const status = error.status ?? 400;
        if (wantsJson(req)) return res.status(status).json({ error: error.message });
        res.status(status).render("login", { error: error.message });
    }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body ?? {};
    try {
        const user = await UserRepository.login({ username, password });
        const token = setSession(res, user);
        if (wantsJson(req)) return res.json({ user, token });
        res.redirect("/protected");
    } catch (error) {
        // 401 = no autenticat
        const status = error.status === 401 ? 401 : 400;
        if (wantsJson(req)) return res.status(status).json({ error: error.message });
        res.status(status).render("login", { error: error.message });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("access_token");
    if (wantsJson(req)) return res.json({ message: "Sessió tancada" });
    res.redirect("/");
});

router.get("/protected", requireAuth, (req, res) => {
    res.render("protected");
});

router.get("/profile", requireAuth, (req, res) => {
    const profile = UserRepository.getById(req.session.user.id);
    if (!profile) {
        // L'usuari del token ja no existeix a la "base de dades"
        res.clearCookie("access_token");
        if (wantsJson(req)) return res.status(401).json({ error: "Usuari inexistent" });
        return res.redirect("/login");
    }
    const books = readJSON("./db/books.json").filter((b) => b.ownerId === profile.id);
    if (wantsJson(req)) return res.json({ user: profile, books });
    res.render("profile", { profile, books });
});

export default router;
