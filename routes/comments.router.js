const {deleteComment, patchComment} = require("../controllers/comments.controller");

const commentRouter = require("express").Router();

commentRouter
  .route("/:comment_id")
  .delete(deleteComment)
  .patch(patchComment);

module.exports = commentRouter;