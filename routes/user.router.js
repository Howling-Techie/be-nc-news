const {postUser, signInUser, getCurrentUser} = require("../controllers/users.controller");

const userRouter = require("express").Router();

userRouter.route("/").get(getCurrentUser);

userRouter.route("/register").post(postUser);

userRouter.route("/signin").get(signInUser);

module.exports = userRouter;