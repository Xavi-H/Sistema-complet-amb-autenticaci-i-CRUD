import express from "express";
import fs from "fs"; //treballar amb arxius

const router = express.Router();

// Ruta al JSON relativa a aquest fitxer (no depèn des d'on executis node)
const DB_PATH = new URL("../db/reserves.json", import.meta.url);
const CARTAS_PATH = new URL("../db/cartas.json", import.meta.url);

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

// Comprova que la carta existeix abans de reservar-la
const cartaExists = (idCarta) => {
    const cartas = JSON.parse(fs.readFileSync(CARTAS_PATH)).cartas;
    return cartas.some((c) => c.id === idCarta);
};

// ##############################
//          ENDPOINTS
// ##############################

// GET /reserves -> totes les reserves
router.get("/", (req, res) => {
    const data = readData();
    res.json(data.reserves);
});

// GET /reserves/:id -> una reserva
router.get("/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const reserva = data.reserves.find((r) => r.id === id);
    if (!reserva) return res.status(404).json({ error: "Reserva no trobada" });
    res.json(reserva);
});

// POST /reserves -> crear una reserva
router.post("/", (req, res) => {
    const data = readData();
    const { nameUser, idCarta } = req.body;
    if (!nameUser || !idCarta) {
        return res.status(400).json({ error: "nameUser i idCarta són obligatoris" });
    }
    if (!cartaExists(Number(idCarta))) {
        return res.status(400).json({ error: "La carta no existeix" });
    }

    const newReserva = {
        id: data.reserves.length ? Math.max(...data.reserves.map((r) => r.id)) + 1 : 1,
        nameUser,
        idCarta: Number(idCarta),
    };
    data.reserves.push(newReserva);
    writeData(data);
    res.status(201).json(newReserva);
});

// PUT /reserves/:id -> modificar una reserva
router.put("/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.reserves.findIndex((r) => r.id === id);
    if (index === -1) return res.status(404).json({ error: "Reserva no trobada" });

    const { nameUser, idCarta } = req.body;
    if (idCarta && !cartaExists(Number(idCarta))) {
        return res.status(400).json({ error: "La carta no existeix" });
    }

    data.reserves[index] = {
        ...data.reserves[index],
        ...(nameUser && { nameUser }),
        ...(idCarta && { idCarta: Number(idCarta) }),
    };
    writeData(data);
    res.json(data.reserves[index]);
});

// DELETE /reserves/:id -> eliminar una reserva
router.delete("/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.reserves.findIndex((r) => r.id === id);
    if (index === -1) return res.status(404).json({ error: "Reserva no trobada" });

    const [borrada] = data.reserves.splice(index, 1);
    writeData(data);
    res.json({ message: "Reserva eliminada", reserva: borrada });
});

export default router;