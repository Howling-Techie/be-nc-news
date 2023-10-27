const db = require("../db/connection");
const {checkIfExists} = require("./utils.model");
const format = require("pg-format");
const jwt = require("jsonwebtoken");

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

exports.updateCommentVotes = async (comment_id, body) => {
    if (Number.isNaN(+comment_id)) {
        return Promise.reject({status: 400, msg: "Invalid comment_id datatype"});
    }

    if (!("token" in body)) {
        return Promise.reject({status: 400, msg: "Request missing token"});
    }
    if (!("vote" in body)) {
        return Promise.reject({status: 400, msg: "Request missing vote"});
    }

    const {vote, token} = body;
    if (Number.isNaN(+vote) || Math.floor(vote) !== vote) {
        return Promise.reject({status: 400, msg: "Invalid vote datatype"});
    }

    if (!(await checkIfExists("comments", "comment_id", comment_id))) {
        return Promise.reject({status: 404, msg: "Comment not found"});
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const username = decoded.username;
        await db.query(`INSERT INTO comment_votes(comment_id, username, vote)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (comment_id, username)
                            DO UPDATE SET vote = $3;`,
            [comment_id, username, vote]);
        const commentScore = await db.query(`
            SELECT c.comment_id,
                   c.body,
                   (CAST(COALESCE(SUM(v.vote), 0) AS int) + c.votes) as votes,
                   c.author,
                   c.article_id,
                   c.created_at
            FROM comments c
                     LEFT JOIN comment_votes v ON c.comment_id = v.comment_id
            WHERE c.comment_id = $1
            GROUP BY c.comment_id;`, [comment_id]);
        return commentScore.rows[0];
    } catch {
        return Promise.reject({status: 401, msg: "Unauthorised"});
    }
};