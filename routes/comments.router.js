const {deleteComment, patchComment, patchCommentVotes} = require("../controllers/comments.controller");

const commentRouter = require("express").Router();

commentRouter
    .route("/:comment_id")
    .delete(deleteComment)
    .patch(patchComment);

commentRouter
    .route("/:comment_id/vote")
    .patch(patchCommentVotes);

module.exports = commentRouter;