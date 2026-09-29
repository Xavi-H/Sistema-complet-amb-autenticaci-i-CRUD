import express from "express";
import fs from "fs"; //treballar amb arxius
import bodyParser from "body-parser"; //Ho afegim per entendre que estem rebent un json des de la petició post.
import booksRoutes from "./routes/productes.js";
import productsRoutes from "./routes/productes.js";

//Creo l'objecte de l'aplicació
const app=express();
app.use(bodyParser.json())
app.use("/books", booksRoutes);
app.use("/products", productsRoutes);





// #############################
//            EJS
// #############################

app.use(express.static("public"));//carpeta publica pel css
app.set('view engine','ejs');//Fem servir el motor ejs
app.set('views', './views'); //carpeta on desem els arxius .ejs


//Funció per escoltar
app.listen(3000,()=>{
    console.log("Server listing on port 3000");
});