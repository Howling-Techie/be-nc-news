const {selectArticle, selectArticles, selectArticleComments} = require("../models/articles.model");

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