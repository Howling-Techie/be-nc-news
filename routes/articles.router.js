const {
  getArticles,
  getArticle,
  getArticleComments,
  postArticleComment,
  patchArticle
} = require("../controllers/articles.controller");

const articleRouter = require("express").Router();

articleRouter
  .route("/")
  .get(getArticles);

articleRouter
  .route("/:article_id")
  .get(getArticle)
  .patch(patchArticle);

articleRouter
  .route("/:article_id/comments")
  .get(getArticleComments)
  .post(postArticleComment);


module.exports = articleRouter;