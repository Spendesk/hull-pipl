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
    "outgoing.user.error"
  );
};
