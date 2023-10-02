const express = require("express");
const {getTopics} = require("./controllers/topics.controller");

const app = express();
app.use(express.json());

app.get("/api/healthcheck", (req, res) => {
  res.status(200).send({});
});

app.get("/api/topics", getTopics);

app.use((err, req, res, next) => {
  if (err.status && err.msg) {
    res.status(err.status).send({msg: err.msg});
  } else if (err.code === "22P02") {
    res.status(400).send({mgs: "Invalid datatype detected"});
  } else {
    console.log(err);
    res.status(500).send({msg: "Internal Server Error"});
  }
});

module.exports = app;