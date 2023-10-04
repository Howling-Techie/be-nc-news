const articleRouter = require("./articles.router");
const commentRouter = require("./comments.router");
const topicRouter = require("./topics.router");
const userRouter = require("./users.router");
const {readFile} = require("fs/promises");

const apiRouter = require("express").Router();

apiRouter.get("/", async (req, res) => {
  const endpointsFile = await readFile("./endpoints.json", {encoding: "utf-8"});
  //const endpointsFile = await readFile("./api.json", {encoding: "utf-8"});
  const endpoints = JSON.parse(endpointsFile);
  res.status(200).send({endpoints});
});

apiRouter.use("/articles", articleRouter);
apiRouter.use("/comments", commentRouter);
apiRouter.use("/topics", topicRouter);
apiRouter.use("/users", userRouter);

module.exports = apiRouter;