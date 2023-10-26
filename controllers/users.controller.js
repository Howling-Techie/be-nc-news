const {
    selectUsers,
    selectUser,
    insertUser,
    signInUser,
    selectCurrentUser,
    refreshCurrentUser
} = require("../models/users.model");

exports.getUsers = (req, res, next) => {
    selectUsers()
        .then((users) => {
            res.status(200).send({users});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getUser = (req, res, next) => {
    selectUser(req.params.username)
        .then((user) => {
            res.status(200).send({user});
        })
        .catch((error) => {
            next(error);
        });
};

exports.postUser = (req, res, next) => {
    insertUser(req.body)
        .then((token) => {
            res.status(201).send({token});
        })
        .catch((error) => {
            next(error);
        });
};

exports.signInUser = (req, res, next) => {
    signInUser(req.body)
        .then((response) => {
            res.status(200).send(response);
        })
        .catch((error) => {
            next(error);
        });
};

exports.getCurrentUser = (req, res, next) => {
    selectCurrentUser(req.body)
        .then((user) => {
            res.status(200).send({user});
        })
        .catch((error) => {
            next(error);
        });
};

exports.refreshUser = (req, res, next) => {
    refreshCurrentUser(req.body)
        .then((token) => {
            res.status(200).send(token);
        })
        .catch((error) => {
            next(error);
        });
};