/* @flow */
import type { $Application } from "express";

const cors = require("cors");
const { notificationHandler, batchHandler } = require("hull/lib/handlers");
const { credsFromQueryMiddlewares } = require("hull/lib/utils");

const actions = require("./actions/index");

function server(app: $Application): $Application {
  app.post(
    "/smart-notifier",
    notificationHandler({
      "user:update": actions.userUpdate
    })
  );

  app.post(
    "/batch",
    batchHandler({
      "user:update": {
        callback: actions.userUpdate,
        options: {
          maxSize: 200
        }
      }
    })
  );
  
  app.get(
    "/request-params-fields",
    cors(),
    ...credsFromQueryMiddlewares(),
    actions.requestParamsFields
  );

  app.get("/admin", ...credsFromQueryMiddlewares(), actions.adminHandler);

  app.all("/status", ...credsFromQueryMiddlewares(), actions.statusCheck);

  return app;
}

module.exports = server;
