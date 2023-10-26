const {deleteComment, updateComment, updateCommentVotes} = require("../models/comments.model");

exports.deleteComment = (req, res, next) => {
    deleteComment(req.params.comment_id)
        .then(() => {
            res.status(204).send();
        })
        .catch((error) => {
            next(error);
        });
};

exports.patchComment = (req, res, next) => {
    updateComment(req.params.comment_id, req.body)
        .then((comment) => {
            res.status(200).send({comment});
        })
        .catch((error) => {
            next(error);
        });
};

exports.patchCommentVotes = (req, res, next) => {
    updateCommentVotes(req.params.comment_id, req.body)
        .then((votes) => {
            res.status(200).send(votes);
        })
        .catch((error) => {
            next(error);
        });
};