const {selectArticle, selectArticles} = require("../models/articles.model");

exports.getArticle = (req, res, next) => {
  selectArticle(req.params.article_id)
    .then((article) => {
      res.status(200).send({article});
    })
    .catch((error) => {
      next(error);
    });
};

exports.getArticles = (req, res, next) => {
  selectArticles()
    .then((articles) => {
      res.status(200).send({articles});
    })
    .catch((error) => {
      next(error);
    });
};