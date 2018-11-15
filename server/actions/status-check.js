/* @flow */
import type { $Response } from "express";
import type { THullRequest } from "hull";

const _ = require("lodash");
const SyncAgent = require("../lib/sync-agent");

function statusCheckAction(req: THullRequest, res: $Response): void {
  if (_.has(req, "hull.connector.private_settings")) {
    const { client } = req.hull;
    const connector = req.hull.connector;
    const syncAgent = new SyncAgent(req.hull);
    const messages: Array<string> = [];
    let status: string = "ok";

    if (syncAgent.isAuthenticationConfigured() === false) {
      status = "error";
      messages.push(
        "Cannot communicate with API because no API key is configured."
      );
    }

    if (_.isEmpty(_.get(connector, "private_settings.user_email"))) {
      status = "error";
      messages.push("User email trait is missing.");
    }

    if (_.isEmpty(_.get(connector, "private_settings.user_first_name"))) {
      status = "error";
      messages.push("User first name trait is missing.");
    }

    if (_.isEmpty(_.get(connector, "private_settings.user_last_name"))) {
      status = "error";
      messages.push("User last name trait is missing.");
    }

    if (_.isEmpty(_.get(connector, "private_settings.pipl_daily_rate_limit"))) {
      status = "error";
      messages.push("Pipl daily rate limit is missing.");
    }

    if (
      _.isEmpty(_.get(connector, "private_settings.pipl_match_requirements"))
    ) {
      status = "error";
      messages.push("Pipl match requirements are missing.");
    }

    if (
      _.isEmpty(
        _.get(connector, "private_settings.synchronized_user_segments", [])
      )
    ) {
      status = "warning";
      messages.push(
        "No users will be enrich due to missing segments configuration."
      );
    }

    res.json({ status, messages });
    client.put(`${connector.id}/status`, { status, messages });
    return;
  }

  res.status(404).json({
    status: 404,
    messages: ["Request doesn't contain data about the connector"]
  });
}

module.exports = statusCheckAction;
