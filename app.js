const express = require("express");

const app = express();
const apiRouter = require("./routes/api.router");
const path = require("path");
app.use(express.json());

app.use("/api", apiRouter);
app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "api.html");
  res.sendFile(filePath);
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