import express from "express";
import fs from "fs"; //treballar amb arxius
// import bodyParser from "body-parser"; //Ho afegim per entendre que estem rebent un json des de la petició post.

//Creo l'objecte de l'aplicació
const router = express.Router();

const readData=()=>{
    try{
        const data=fs.readFileSync("./../db/reserves.json");
        return JSON.parse(data)

    }catch(error){
        console.log(error);
    }
};

//Funció per escriure informació
const writeData=(data)=>{
    try{
        fs.writeFileSync("./../db/reserves.json",JSON.stringify(data));

    }catch(error){
        console.log(error);
    }
}

// ##############################
//          ENDPOINTS
// ##############################

/*
router.get("/",(req,res)=>{
    // res.send("Wellcome to my first API with Node.js");
    const user = {name:"Xavi"}
    const htmlMessage = `
        <p>Aquest és un text <strong>amb estil</strong> i un enllaç:</p>
        <a href="https://www.example.com">Visita Example</a>`;
    const data = readData();
    res.render("books",{user, data,htmlMessage})

});
*/

//Creem un endpoint per obtenir tots els llibres
router.get("/",(req,res)=>{
    const data = readData();
    const user = "Xavi";
    const htmlMessage = `
        <p>Aquest és un text <strong>amb estil</strong> i un enllaç:</p>
        <a href="https://www.example.com">Visita Example</a>`;
    res.render("books",{user, data, htmlMessage});
    
    //res.json(data.books);
})

//Obtenir llibre per id
router.get("/:id",(req,res)=>{
    const data=readData();
    const id=parseInt(req.params.id);
    const book=data.books.find((book)=>book.id===id);
    res.json(book);
})


//Creem un endpoint del tipus post per afegir un llibre

router.post("/",(req,res)=>{
    const data = readData();
    const body = req.body;

    //todo lo que viene en ...body se agrega al nuevo libro
    const newBook={
        id:data.books.length+1,
        ...body,
    };
    data.books.push(newBook);
    writeData(data);
    res.json(newBook);
});

//Creem un endpoint per modificar un llibre


router.put("/:id", (req, res) => {
    const data = readData();
    const body = req.body;
    const id = parseInt(req.params.id);
    const bookIndex = data.books.findIndex((book) => book.id === id);
    data.books[bookIndex] = {
      ...data.books[bookIndex],
      ...body,
    };
    writeData(data);
    res.json({ message: "Book updated successfully" });
  });

//Creem un endpoint per eliminar un llibre
router.delete("/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const bookIndex = data.books.findIndex((book) => book.id === id);
    //splice esborra a partir de bookIndex, el número de elements 
    // que li indiqui al segon argument, en aquest cas 1
    data.books.splice(bookIndex, 1);
    writeData(data);
    res.json({ message: "Book deleted successfully" });
  });

  export default router;