const {
  selectArticle,
  selectArticles,
  selectArticleComments,
  insertArticleComment
} = require("../models/articles.model");

exports.getArticles = (req, res, next) => {
  selectArticles()
    .then((articles) => {
      res.status(200).send({articles});
    })
    .catch((error) => {
      next(error);
    });
};

exports.getArticle = (req, res, next) => {
  selectArticle(req.params.article_id)
    .then((article) => {
      res.status(200).send({article});
    })
    .catch((error) => {
      next(error);
    });
};

exports.getArticleComments = (req, res, next) => {
  selectArticleComments(req.params.article_id)
    .then((comments) => {
      res.status(200).send({comments});
    })
    .catch((error) => {
      next(error);
    });
};

exports.postArticleComment = (req, res, next) => {
  insertArticleComment(req.params.article_id, req.body)
    .then((comment) => {
      res.status(201).send({comment});
    })
    .catch((error) => {
      next(error);
    });
};