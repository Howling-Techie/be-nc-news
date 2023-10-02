const db = require("../db/connection");

exports.deleteComment = async (comment_id) => {
  if (Number.isNaN(+comment_id)) {
    return Promise.reject({status: 400, msg: "Invalid comment_id datatype"});
  }
  const results = await db.query(`DELETE
                                  FROM comments
                                  WHERE comment_id = $1`, [comment_id]);

  if (results.rowCount === 0) {
    return Promise.reject({status: 404, msg: "Article not found"});
  }
};