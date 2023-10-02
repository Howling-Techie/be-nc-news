const {deleteComment} = require("../models/comments.model");

exports.deleteComment = (req, res, next) => {
  deleteComment(req.params.comment_id)
    .then(() => {
      res.status(201).send();
    })
    .catch((error) => {
      next(error);
    });
};