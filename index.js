import express from "express";
import bodyParser from "body-parser"; //Ho afegim per entendre que estem rebent un json des de la petició post.
import cartasRoutes from "./routes/cartas.js";
import reservesRoutes from "./routes/reserves.js";

//Creo l'objecte de l'aplicació
const app = express();
app.use(bodyParser.json());

// #############################
//          RUTES
// #############################

app.use("/cartas", cartasRoutes);
app.use("/reserves", reservesRoutes);

// #############################
//            EJS
// #############################

app.use(express.static("public")); //carpeta publica pel css
app.set("view engine", "ejs"); //Fem servir el motor ejs
app.set("views", "./views"); //carpeta on desem els arxius .ejs

//Funció per escoltar
app.listen(3000, () => {
    console.log("Server listening on port 3000");
});