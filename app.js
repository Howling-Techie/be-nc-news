const express = require("express");
const {getTopics} = require("./controllers/topics.controller");
const {readFile} = require("fs/promises");
const {getArticle} = require("./controllers/articles.controller");

const app = express();
app.use(express.json());

app.get("/api", async (req, res) => {
  const endpointsFile = await readFile("./endpoints.json", {encoding: "utf-8"});
  const endpoints = JSON.parse(endpointsFile);
  res.status(200).send({endpoints});
});

app.get("/api/topics", getTopics);

app.get("/api/articles/:article_id", getArticle);

app.use((err, req, res, next) => {
  if (err.status && err.msg) {
    res.status(err.status).send({msg: err.msg});
  } else {
    console.log();
    res.status(500).send({msg: "Internal Server Error"});
  }
});

module.exports = app;