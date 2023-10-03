const db = require("../db/connection");
const format = require("pg-format");

exports.checkIfExists = async (tableName, columnName, value) => {
  if (Number.isNaN(+value)) {
    const query = format("SELECT %I FROM %I WHERE %I like %L", columnName, tableName, columnName, value);
    return (await db.query(query)).rows.length > 0;
  }
  const query = format("SELECT %I FROM %I WHERE %I = %s", columnName, tableName, columnName, value);
  return (await db.query(query)).rows.length > 0;
};