const {getTopics, postTopic} = require("../controllers/topics.controller");
const topicRouter = require("express").Router();

topicRouter
  .route("/")
  .get(getTopics)
  .post(postTopic);

module.exports = topicRouter;