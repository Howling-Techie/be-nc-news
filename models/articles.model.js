const db = require("../db/connection");

exports.selectArticle = async (article_id) => {
  if (Number.isNaN(+article_id)) {
    return Promise.reject({status: 400, msg: "Invalid article_id datatype"});
  }
  const results = await db.query(`SELECT *
                                  FROM articles
                                  WHERE article_id = $1`, [article_id]);

  if (results.rows.length === 0) {
    return Promise.reject({status: 404, msg: "Article not found"});
  }
  return results.rows[0];
};

exports.selectArticles = async () => {
  const results = await db.query(`SELECT author,
                                         title,
                                         a.article_id,
                                         topic,
                                         created_at,
                                         votes,
                                         article_img_url,
                                         comment_count
                                  FROM articles a
                                           LEFT JOIN (SELECT article_id, COUNT(comment_id) as comment_count
                                                      FROM comments
                                                      GROUP BY article_id) c on c.article_id = a.article_id;`);
  return results.rows.map((row) => ({...row, comment_count: +row.comment_count}));
};