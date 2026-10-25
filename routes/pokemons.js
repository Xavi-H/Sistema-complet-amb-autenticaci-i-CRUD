import { Router } from "express";
import { readJSON, writeJSON, wantsJson, sendError } from "../helpers.js";
import { requireAuth } from "../middleware.js";

const FILE = "./db/pokemons.json";
const router = Router();

// Regla de negoci: només usuaris autenticats poden accedir al CRUD
router.use(requireAuth);

// Regla de negoci: només el propietari o un admin pot editar/esborrar
const canEdit = (user, pokemon) => user.role === "admin" || pokemon.ownerId === user.id;

const findPokemon = (id) => readJSON(FILE).find((b) => b.id === Number(id));

// Retorna un text d'error, o null si les dades són correctes
function validate({ name, Tipus }) {
    if (typeof name !== "string" || name.trim() === "") return "El nom és obligatori";
    if (typeof Tipus !== "string" || Tipus.trim() === "") return "El tipus és obligatori";
    return null;
}

// Regla de negoci: no es poden repetir cartes amb el mateix nom
const isDuplicated = (pokemons, { name }, ignoreId) =>
    pokemons.some(
        (b) => b.id !== ignoreId && b.name.toLowerCase() === name.trim().toLowerCase()
    );

// GET /pokemons -> llista
router.get("/", (req, res) => {
    const pokemons = readJSON(FILE);
    if (wantsJson(req)) return res.json(pokemons);
    res.render("pokemons", { pokemons });
});

// GET /pokemons/new -> formulari de creació (ha d'anar abans de /:id)
router.get("/new", (req, res) => {
    res.render("pokemon_form", { pokemon: null });
});

// GET /pokemons/:id -> una carta
router.get("/:id", (req, res) => {
    const pokemon = findPokemon(req.params.id);
    if (!pokemon) return sendError(req, res, 404, "Carta no trobada");
    if (wantsJson(req)) return res.json(pokemon);
    res.render("pokemon", { pokemon });
});

// GET /pokemons/:id/edit -> formulari d'edició
router.get("/:id/edit", (req, res) => {
    const pokemon = findPokemon(req.params.id);
    if (!pokemon) return sendError(req, res, 404, "Carta no trobada");
    if (!canEdit(req.session.user, pokemon)) {
        return sendError(req, res, 403, "No pots editar aquesta carta");
    }
    res.render("pokemon_form", { pokemon });
});

// POST /pokemons -> crear
router.post("/", (req, res) => {
    const { name, Tipus } = req.body ?? {};
    const error = validate({ name, Tipus });
    if (error) return sendError(req, res, 400, error, "pokemon_form", { pokemon: { name, Tipus } });

    const pokemons = readJSON(FILE);
    if (isDuplicated(pokemons, { name })) {
        return sendError(req, res, 409, "Aquesta carta ja existeix", "pokemon_form", {
            pokemon: { name, Tipus }
        });
    }

    const pokemon = {
        id: pokemons.reduce((max, b) => Math.max(max, b.id), 0) + 1,
        name: name.trim(),
        Tipus: Tipus.trim(),
        ownerId: req.session.user.id,
        ownerName: req.session.user.username
    };
    pokemons.push(pokemon);
    writeJSON(FILE, pokemons);

    if (wantsJson(req)) return res.status(201).json(pokemon);
    res.redirect("/pokemons");
});

// PUT /pokemons/:id -> modificar
router.put("/:id", (req, res) => {
    const pokemons = readJSON(FILE);
    const pokemon = pokemons.find((b) => b.id === Number(req.params.id));
    if (!pokemon) return sendError(req, res, 404, "Carta no trobada");
    if (!canEdit(req.session.user, pokemon)) {
        return sendError(req, res, 403, "No pots editar aquesta carta");
    }

    const { name, Tipus } = req.body ?? {};
    const formBook = { id: pokemon.id, name, Tipus };
    const error = validate({ name, Tipus });
    if (error) return sendError(req, res, 400, error, "pokemon_form", { pokemon: formBook });
    if (isDuplicated(pokemons, { name }, pokemon.id)) {
        return sendError(req, res, 409, "Aquesta carta ja existeix", "pokemon_form", { pokemon: formBook });
    }

    pokemon.name = name.trim();
    pokemon.Tipus = Tipus.trim();
    writeJSON(FILE, pokemons);

    if (wantsJson(req)) return res.json(pokemon);
    res.redirect("/pokemons");
});

// DELETE /pokemons/:id -> esborrar
router.delete("/:id", (req, res) => {
    const pokemons = readJSON(FILE);
    const pokemon = pokemons.find((b) => b.id === Number(req.params.id));
    if (!pokemon) return sendError(req, res, 404, "Carta no trobada");
    if (!canEdit(req.session.user, pokemon)) {
        return sendError(req, res, 403, "No pots esborrar aquesta carta");
    }

    writeJSON(FILE, pokemons.filter((b) => b.id !== pokemon.id));

    if (wantsJson(req)) return res.json({ message: "Carta eliminada" });
    res.redirect("/pokemons");
});

export default router;