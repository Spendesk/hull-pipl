const _ = require("lodash");
const payload = require("../../fixtures/api-responses/many-match-users.json");

module.exports = nock => {
  nock("https://api.pipl.com/")
    .get(/search/)
    .reply(200, payload);
};
