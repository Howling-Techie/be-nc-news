const articleRouter = require("./articles.router");
const commentRouter = require("./comments.router");
const topicRouter = require("./topics.router");
const usersRouter = require("./users.router");
const {readFile} = require("fs/promises");
const userRouter = require("./user.router");

const apiRouter = require("express").Router();

apiRouter.get("/", async (req, res) => {
    //const endpointsFile = await readFile("./endpoints.json", {encoding: "utf-8"});
    const endpointsFile = await readFile("./api.json", {encoding: "utf-8"});
    const endpoints = JSON.parse(endpointsFile);
    res.status(200).send({endpoints});
});

apiRouter.use("/articles", articleRouter);
apiRouter.use("/comments", commentRouter);
apiRouter.use("/topics", topicRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/user", userRouter);

module.exports = apiRouter;