const {
    selectArticle,
    selectArticles,
    selectArticleComments,
    insertArticleComment, updateArticle, insertArticle
} = require("../models/articles.model");
const {updateCommentVotes} = require("../models/comments.model");

exports.getArticles = (req, res, next) => {
    selectArticles(req.query)
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
    selectArticleComments(req.params.article_id, req.query)
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

exports.patchArticle = (req, res, next) => {
    updateArticle(req.params.article_id, req.body)
        .then((article) => {
            res.status(200).send({article});
        })
        .catch((error) => {
            next(error);
        });
};

exports.postArticle = (req, res, next) => {
    insertArticle(req.body)
        .then((article) => {
            res.status(201).send({article});
        })
        .catch((error) => {
            next(error);
        });
};

exports.patchArticleVotes = (req, res, next) => {
    updateArticleVotes(req.params.comment_id, req.body)
        .then((votes) => {
            res.status(200).send(votes);
        })
        .catch((error) => {
            next(error);
        });
};