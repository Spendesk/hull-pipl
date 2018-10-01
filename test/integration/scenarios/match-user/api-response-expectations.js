const _ = require("lodash");
const payload = require("../../fixtures/api-responses/match-user.json");

module.exports = nock => {
  nock("https://api.pipl.com/")
    .get(/search/)
    .reply(200, payload);
};