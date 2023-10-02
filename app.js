const express = require("express");
const {getTopics} = require("./controllers/topics.controller");

const app = express();

app.get("/api/topics", getTopics);

app.use((err, req, res, next) => {
  if (err.status && err.msg) {
    res.status(err.status).send({msg: err.msg});
  } else {
    res.status(500).send({msg: "Internal Server Error"});
  }
});

module.exports = app;