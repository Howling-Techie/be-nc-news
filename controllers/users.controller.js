const {selectUsers, selectUser} = require("../models/users.model");

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