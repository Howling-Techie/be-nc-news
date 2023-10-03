const express = require("express");
const {getTopics} = require("./controllers/topics.controller");
const {readFile} = require("fs/promises");
const {
  getArticle,
  getArticles,
  getArticleComments,
  postArticleComment,
  patchArticle
} = require("./controllers/articles.controller");
const {deleteComment} = require("./controllers/comments.controller");
const {getUsers} = require("./controllers/users.controller");

const app = express();
app.use(express.json());

app.get("/api", async (req, res) => {
  const endpointsFile = await readFile("./endpoints.json", {encoding: "utf-8"});
  const endpoints = JSON.parse(endpointsFile);
  res.status(200).send({endpoints});
});

//TOPICS
app.get("/api/topics", getTopics);

//ARTICLES
app.get("/api/articles", getArticles);
app.get("/api/articles/:article_id", getArticle);
app.get("/api/articles/:article_id/comments", getArticleComments);
app.post("/api/articles/:article_id/comments", postArticleComment);
app.patch("/api/articles/:article_id", patchArticle);
//COMMENTS
app.delete("/api/comments/:comment_id", deleteComment);

//USERS
app.get("/api/users", getUsers);

app.use((err, req, res, next) => {
  if (err.status && err.msg) {
    res.status(err.status).send({msg: err.msg});
  } else {
    console.log(err);
    res.status(500).send({msg: "Internal Server Error"});
  }
});

module.exports = app;