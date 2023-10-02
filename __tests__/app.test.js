const app = require("../app.js");
const request = require("supertest");
const db = require("../db/connection");
const testData = require("../db/data/test-data/index");
const seed = require("../db/seeds/seed");

afterAll(() => {
  return db.end();
});
beforeEach(() => seed(testData));

describe("GET /api/healthcheck", () => {
  test("return 200 status code", () => {
    return request(app).get("/api/healthcheck").expect(200);
  });
});

describe("GET /api/topics", () => {
  test("return 200 status code", () => {
    return request(app).get("/api/topics").expect(200);
  });
  test("return an array of topics", () => {
    return request(app).get("/api/topics").expect(200).then(({body}) => {
      body.topics.forEach((topic) => {
        expect(typeof topic.slug).toBe("string");
        expect(typeof topic.description).toBe("string");
      });
    });
  });
});