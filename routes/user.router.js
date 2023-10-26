const {postUser, signInUser, getCurrentUser, refreshUser} = require("../controllers/users.controller");

const userRouter = require("express").Router();

userRouter.route("/").get(getCurrentUser);

userRouter.route("/register").post(postUser);

userRouter.route("/signin").get(signInUser);

userRouter.route("/refresh").get(refreshUser);

module.exports = userRouter;