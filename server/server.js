/* @flow */
import type { $Application } from "express";

const { notifHandler, smartNotifierHandler } = require("hull/lib/utils");

const actions = require("./actions/index");

function server(app: $Application): $Application {
  app.post(
    "/smart-notifier",
    smartNotifierHandler({
      handlers: {
        "user:update": actions.userUpdate
      }
    })
  );

  app.post(
    "/batch",
    notifHandler({
      userHandlerOptions: {
        maxSize: 200
      },
      handlers: {
        "user:update": actions.userUpdate
      }
    })
  );

  app.get("/admin", actions.adminHandler);

  app.all("/status", actions.statusCheck);

  return app;
}

module.exports = server;
