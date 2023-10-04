const {getUsers, getUser} = require("../controllers/users.controller");

const userRouter = require("express").Router();

userRouter.route("/").get(getUsers);

userRouter.route("/:username").get(getUser);

module.exports = userRouter;