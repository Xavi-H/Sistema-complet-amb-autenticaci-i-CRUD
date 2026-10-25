import { Router } from "express";
import { UserRepository } from "../user-repository.js";
import { requireAuth, requireAdmin } from "../middleware.js";
import { wantsJson, sendError } from "../helpers.js";

const router = Router();

// Regla de negoci: només admins autenticats poden gestionar usuaris
router.use(requireAuth, requireAdmin);

// GET /users -> llista
router.get("/", (req, res) => {
    const users = UserRepository.getAll();
    if (wantsJson(req)) return res.json(users);
    res.render("users", { users });
});

// GET /users/new -> formulari de creació
router.get("/new", (req, res) => {
    res.render("user_form", { target: null });
});

// GET /users/:id -> un usuari
router.get("/:id", (req, res) => {
    const target = UserRepository.getById(req.params.id);
    if (!target) return sendError(req, res, 404, "Usuari no trobat");
    if (wantsJson(req)) return res.json(target);
    res.render("user_form", { target });
});

// GET /users/:id/edit -> formulari d'edició
router.get("/:id/edit", (req, res) => {
    const target = UserRepository.getById(req.params.id);
    if (!target) return sendError(req, res, 404, "Usuari no trobat");
    res.render("user_form", { target });
});

// POST /users -> crear
router.post("/", async (req, res) => {
    const { username, password, role } = req.body ?? {};
    try {
        const created = await UserRepository.create({ username, password, role });
        if (wantsJson(req)) return res.status(201).json(created);
        res.redirect("/users");
    } catch (error) {
        sendError(req, res, error.status ?? 400, error.message, "user_form", {
            target: { username, role }
        });
    }
});

// PUT /users/:id -> modificar
router.put("/:id", async (req, res) => {
    const { username, password, role } = req.body ?? {};
    const id = req.params.id;
    const formUser = { id, username, role };

    // Regla de negoci: un admin no es pot treure a si mateix el rol d'admin
    if (id === req.session.user.id && role !== undefined && role !== "admin") {
        return sendError(req, res, 400, "No et pots treure el rol d'administrador", "user_form", {
            target: formUser
        });
    }
    try {
        const updated = await UserRepository.update(id, { username, password, role });
        if (!updated) return sendError(req, res, 404, "Usuari no trobat");
        if (wantsJson(req)) return res.json(updated);
        res.redirect("/users");
    } catch (error) {
        sendError(req, res, error.status ?? 400, error.message, "user_form", { target: formUser });
    }
});

// DELETE /users/:id -> esborrar
router.delete("/:id", (req, res) => {
    // Regla de negoci: un admin no es pot esborrar a si mateix
    if (req.params.id === req.session.user.id) {
        return sendError(req, res, 400, "No et pots esborrar a tu mateix");
    }
    const deleted = UserRepository.delete(req.params.id);
    if (!deleted) return sendError(req, res, 404, "Usuari no trobat");
    if (wantsJson(req)) return res.json({ message: "Usuari eliminat" });
    res.redirect("/users");
});

export default router;
