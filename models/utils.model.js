const db = require("../db/connection");
const format = require("pg-format");
const {sign, verify, decode} = require("jsonwebtoken");

exports.checkIfExists = async (tableName, columnName, value) => {
    if (Number.isNaN(+value)) {
        const query = format("SELECT %I FROM %I WHERE %I like %L", columnName, tableName, columnName, value);
        return (await db.query(query)).rows.length > 0;
    }
    const query = format("SELECT %I FROM %I WHERE %I = %s", columnName, tableName, columnName, value);
    return (await db.query(query)).rows.length > 0;
};

exports.generateToken = (payload, duration = "1hr") => {
    return sign(payload, process.env.JWT_KEY, {expiresIn: duration});
};
exports.verifyToken = (token) => {
    try {
        return verify(token, process.env.JWT_KEY);
    } catch (err) {
        return null;
    }
};
exports.refreshToken = (token) => {
    const decodedToken = decode(token);
    const currentTime = Date.now() / 1000;

    if (decodedToken && decodedToken.exp - currentTime < 300) { // If token expires in less than 5 minutes
        return sign({...decodedToken, iat: currentTime}, process.env.JWT_KEY, {expiresIn: "1h"});
    }

    return token;
};