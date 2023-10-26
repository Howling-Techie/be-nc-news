const db = require("../db/connection");
const {checkIfExists, generateToken} = require("./utils.model");
const format = require("pg-format");
const {hashSync, compareSync} = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.selectUsers = async () => {
    return (await db.query(`SELECT *
                            FROM users`)).rows;
};

exports.selectUser = async (username) => {
    const results = await db.query(`SELECT username, name, avatar_url
                                    FROM users
                                    WHERE username = $1`, [username]);

    if (results.rows.length === 0) {
        return Promise.reject({status: 404, msg: "User not found"});
    }
    return results.rows[0];
};

exports.insertUser = async (body) => {
    if (!("username" in body && "name" in body && "password" in body)) {
        return Promise.reject({status: 400, msg: "Missing required properties in body"});
    }
    const {username, name, password, avatar_url = null} = body;

    if (await checkIfExists("users", "username", username)) {
        return Promise.reject({status: 403, msg: "User already exists"});
    }

    const userRegex = /^\w{6,20}$/i;
    const nameRegex = /^[\w\s-]{6,20}$/i;
    const spaceChecker = /^(\s.*)|(.*\s)$/;
    const passRegex = /^\S{6,20}$/i;
    if (!userRegex.test(username)) {
        return Promise.reject({status: 400, msg: "Invalid username"});
    }
    if (!nameRegex.test(name) || spaceChecker.test(name)) {
        return Promise.reject({status: 400, msg: "Invalid name"});
    }
    if (!passRegex.test(password)) {
        return Promise.reject({status: 400, msg: "Invalid password"});
    }

    const hash = hashSync(password, 10);

    const insertQuery = format("INSERT INTO users(username, name, password, avatar_url) VALUES (%L, %L, %L, %L);", username, name, hash, avatar_url);
    await db.query(insertQuery);

    const response = {};
    response.accessToken = generateToken({username: username, name: name});
    response.refreshToken = generateToken({username: username}, "7d");

    return response;
};

exports.signInUser = async (body) => {
    if (!("username" in body && "password" in body)) {
        return Promise.reject({status: 400, msg: "Missing required properties in body"});
    }
    const {username, password} = body;
    const results = await db.query(`SELECT username, name, password, avatar_url
                                    FROM users
                                    WHERE username = $1`, [username]);
    if (results.rows.length === 0) {
        return Promise.reject({status: 404, msg: "User not found"});
    }

    const comparison = compareSync(password, results.rows[0].password);
    if (comparison) {
        const response = {};
        const user = results.rows[0];
        response.user = user;
        response.token = {
            accessToken: generateToken({username: user.username, name: user.name}),
            refreshToken: generateToken({username: user.username}, "7d")
        };

        return response;

    } else {
        return Promise.reject({status: 401, msg: "Invalid password"});
    }
};

exports.selectCurrentUser = async (body) => {
    const {token} = body;

    if (!token) {
        return Promise.reject({status: 400, msg: "No token provided"});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        return await exports.selectUser(decoded.username);
    } catch {
        return Promise.reject({status: 401, msg: "Unauthorized"});
    }
};

exports.refreshCurrentUser = async (body) => {
    const {token} = body;

    if (!token) {
        return Promise.reject({status: 400, msg: "No token provided"});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const user = await exports.selectUser(decoded.username);
        const response = {};
        response.token = {
            accessToken: generateToken({username: user.username, name: user.name}),
            refreshToken: generateToken({username: user.username}, "7d")
        };
        return response;
    } catch {
        return Promise.reject({status: 401, msg: "Unauthorized"});
    }
};