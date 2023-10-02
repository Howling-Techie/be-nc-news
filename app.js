const express = require("express");
const {getTopics} = require("./controllers/topics.controller");
const {readFile} = require("fs/promises");

const app = express();
app.use(express.json());

app.get("/api/topics", getTopics);

app.get("/api", async (req, res) => {
  const endpointsFile = await readFile("./endpoints.json", {encoding: "utf-8"});
  const endpoints = JSON.parse(endpointsFile);
  res.status(200).send({endpoints});
});

app.use((err, req, res, next) => {
  if (err.status && err.msg) {
    res.status(err.status).send({msg: err.msg});
  } else {
    console.log(err);
    res.status(500).send({msg: "Internal Server Error"});
  }
});

module.exports = app;