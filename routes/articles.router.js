const {
    getArticles,
    getArticle,
    getArticleComments,
    postArticleComment,
    patchArticle, postArticle, patchArticleVotes
} = require("../controllers/articles.controller");

const articleRouter = require("express").Router();

articleRouter
    .route("/")
    .get(getArticles)
    .post(postArticle);

articleRouter
    .route("/:article_id")
    .get(getArticle)
    .patch(patchArticle);

articleRouter
    .route("/:article_id/vote")
    .patch(patchArticleVotes);

articleRouter
    .route("/:article_id/comments")
    .get(getArticleComments)
    .post(postArticleComment);


module.exports = articleRouter;