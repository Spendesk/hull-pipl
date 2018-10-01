const _ = require("lodash");
const notifierPayload = _.cloneDeep(
  require("../../fixtures/notifier-payloads/user-update.json")
);
const apiResponse = _.cloneDeep(
  require("../../fixtures/api-responses/match-user.json").person
);

module.exports = ctxMock => {
  const userData = _.get(notifierPayload, "messages[0].user");

  expect(ctxMock.client.asUser.mock.calls[0]).toEqual([userData]);

  const userTraits = {
    "pipl/fetched_at": { operation: "set", value: expect.anything() },
    "pipl/first_name": { operation: "set", value: _.get(apiResponse, "names[0].first") },
    "pipl/last_name": { operation: "set", value: _.get(apiResponse, "names[0].last") },
    "pipl/full_name": { operation: "set", value: _.get(apiResponse, "names[0].display") },
    "pipl/birthday_date": { operation: "set", value: _.get(apiResponse, "dob.date_range.start") },
    "pipl/gender": { operation: "set", value: _.get(apiResponse, "gender.content") },
    "pipl/work_emails": { operation: "set", value: ["jeremy@spendesk.com", "jeremy@goillot.com"] },
    "pipl/personal_emails": { operation: "set", value: ["jeremy-fachetti@gmx.fr", "jeremy.goillot@live.fr"] },
    "pipl/images": { operation: "set", value: _.map(_.get(apiResponse, "images"), "url") },
    "pipl/urls": { operation: "set", value: _.map(_.get(apiResponse, "urls"), "url") },
    "pipl/usernames": { operation: "set", value: _.map(_.get(apiResponse, "usernames"), "content") },
    "pipl/phones": { operation: "set", value: _.map(_.get(apiResponse, "phones"), "display_international") },
    "pipl/languages": { operation: "set", value: _.map(_.get(apiResponse, "languages"), "language") },
    "pipl/addresses": { operation: "set", value: _.map(_.get(apiResponse, "addresses"), "display") },
    "pipl/jobs": { operation: "set", value: _.map(_.get(apiResponse, "jobs"), "display") },
    "pipl/educations": { operation: "set", value: _.map(_.get(apiResponse, "educations"), "display") }
  };

  expect(ctxMock.client.traits.mock.calls[0][0]).toEqual(userTraits);

  expect(ctxMock.metric.increment.mock.calls).toHaveLength(1);
  expect(ctxMock.metric.increment.mock.calls[0]).toEqual([
    "ship.service_api.call",
    1,
    [
      "method:GET",
      "url:https://api.pipl.com/search",
      "status:200",
      "statusGroup:2xx",
      "endpoint:GET https://api.pipl.com/search"
    ]
  ]);

  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(1); // debug calls from super-agent
  expect(ctxMock.client.logger.error.mock.calls).toHaveLength(0);

  expect(ctxMock.client.logger.info.mock.calls).toHaveLength(1);
  expect(ctxMock.client.logger.info.mock.calls[0][0]).toEqual(
    "outgoing.user.success"
  );
};
