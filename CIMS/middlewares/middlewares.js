const express = require("express");
const session = require("express-session");
const setLocals = require("./setLocals");

const middlewares = [
  session({
    cookie: {
      secure: false,
      maxAge: 604800000,
    },
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  }),
  express.static("public"),
  express.json(),
  express.urlencoded({ extended: true }),
  setLocals(),
];

module.exports = (app) => {
  middlewares.forEach((middleware) => {
    app.use(middleware);
  });
};
