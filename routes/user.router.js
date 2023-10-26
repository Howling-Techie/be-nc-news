const {postUser, signInUser, getCurrentUser, refreshUser} = require("../controllers/users.controller");

const userRouter = require("express").Router();

userRouter.route("/").post(getCurrentUser);

userRouter.route("/register").post(postUser);

userRouter.route("/signin").post(signInUser);

userRouter.route("/refresh").post(refreshUser);

module.exports = userRouter;