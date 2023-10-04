const db = require("../db/connection");
const {checkIfExists} = require("./utils.model");
const format = require("pg-format");

exports.deleteComment = async (comment_id) => {
  if (Number.isNaN(+comment_id)) {
    return Promise.reject({status: 400, msg: "Invalid comment_id datatype"});
  }
  const results = await db.query(`DELETE
                                  FROM comments
                                  WHERE comment_id = $1`, [comment_id]);

  if (results.rowCount === 0) {
    return Promise.reject({status: 404, msg: "Comment not found"});
  }
};

exports.updateComment = async (comment_id, body) => {
  if (!body || body === {}) {
    return Promise.reject({status: 304, msg: "Comment not changed"});
  }
  const {inc_votes} = body;
  if (inc_votes === undefined) {
    return Promise.reject({status: 304, msg: "Comment not changed"});
  }
  if (Number.isNaN(+inc_votes) || Math.floor(inc_votes) !== inc_votes) {
    return Promise.reject({status: 400, msg: "Invalid inc_votes datatype"});
  }
  if (inc_votes === 0) {
    return Promise.reject({status: 304, msg: "Comment not changed"});
  }
  if (!(await checkIfExists("comments", "comment_id", comment_id))) {
    return Promise.reject({status: 404, msg: "Comment not found"});
  }

  const query = format("UPDATE comments SET votes = votes + %s WHERE comment_id = %s RETURNING *;"
    , inc_votes, comment_id);
  return (await db.query(query)).rows[0];
};