import express from "express";
import methodOverride from "method-override";
import cookieParser from "cookie-parser";
import { PORT } from "./config.js";
import { loadUser } from "./middleware.js";
import { sendError } from "./helpers.js";
import authRoutes from "./routes/auth.js";
import pokemonsRoutes from "./routes/pokemons.js";
import usersRoutes from "./routes/users.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method")); // permet PUT i DELETE des dels formularis HTML
app.use(express.static("public")); // permet utilitzar el css de la carpeta public

app.set("view engine", "ejs"); // Motor de plantilles
app.set("views", "./views"); // Ubicació de les plantilles

// Middleware d'autenticació: carrega l'usuari del JWT a req.session.user
app.use(loadUser);

app.use("/", authRoutes);
app.use("/pokemons", pokemonsRoutes);
app.use("/users", usersRoutes);

// Ruta no trobada
app.use((req, res) => {
    sendError(req, res, 404, "Ruta no trobada");
});

app.listen(PORT, () => {
    console.log(`Servidor funcionant a http://localhost:${PORT}`);
});
