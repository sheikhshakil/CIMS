require("dotenv").config();
const express = require("express");
//import custom libs
const router = require("./routes/router");
const setMiddlewares = require('./middlewares/middlewares')

//creating app
const app = express();

//setting view engine and views
app.set("view engine", "ejs");
app.set("views", "views");

//middlewares
setMiddlewares(app)

//set routes
app.use("/", router);

app.listen(process.env.PORT, () => {
  console.log("CIMS server started.");
});
