import express from "express";
import fs from "fs"; //treballar amb arxius

const router = express.Router();

// Ruta al JSON relativa a aquest fitxer (no depèn des d'on executis node)
const DB_PATH = new URL("../db/cartas.json", import.meta.url);

//Funció per llegir informació
const readData = () => {
    try {
        const data = fs.readFileSync(DB_PATH);
        return JSON.parse(data);
    } catch (error) {
        console.log(error);
    }
};

//Funció per escriure informació
const writeData = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 4));
    } catch (error) {
        console.log(error);
    }
};

// ##############################
//          ENDPOINTS
// ##############################

// GET /cartas -> totes les cartes
router.get("/", (req, res) => {
    const data = readData();
    res.json(data.cartas);
});

// GET /cartas/:id -> una carta
router.get("/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const carta = data.cartas.find((c) => c.id === id);
    if (!carta) return res.status(404).json({ error: "Carta no trobada" });
    res.json(carta);
});

// POST /cartas -> crear una carta
router.post("/", (req, res) => {
    const data = readData();
    const { name, Tipus } = req.body;
    if (!name || !Tipus) {
        return res.status(400).json({ error: "name i Tipus són obligatoris" });
    }

    const newCarta = {
        // max+1 evita ids repetits si s'ha esborrat alguna carta
        id: data.cartas.length ? Math.max(...data.cartas.map((c) => c.id)) + 1 : 1,
        name,
        Tipus,
    };
    data.cartas.push(newCarta);
    writeData(data);
    res.status(201).json(newCarta);
});

// PUT /cartas/:id -> modificar una carta
router.put("/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.cartas.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: "Carta no trobada" });

    const { name, Tipus } = req.body;
    data.cartas[index] = {
        ...data.cartas[index],
        ...(name && { name }),
        ...(Tipus && { Tipus }),
    };
    writeData(data);
    res.json(data.cartas[index]);
});

// DELETE /cartas/:id -> eliminar una carta
router.delete("/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.cartas.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: "Carta no trobada" });

    //splice esborra a partir de index, el número d'elements indicat al segon argument
    const [borrada] = data.cartas.splice(index, 1);
    writeData(data);
    res.json({ message: "Carta eliminada", carta: borrada });
});

export default router;