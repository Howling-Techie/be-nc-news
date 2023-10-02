const express = require("express");
const {readFile} = require("fs/promises");

const app = express();
app.use(express.json());

app.get("/api/healthcheck", (req, res) => {
  res.status(200).send({});
});

app.get("/api", async (req, res) => {
  const endpointsFile = await readFile("./endpoints.json", {encoding: "utf-8"});
  const endpoints = JSON.parse(endpointsFile);
  res.status(200).send({endpoints});
});

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