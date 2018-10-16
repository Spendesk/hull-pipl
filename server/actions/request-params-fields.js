/* @flow */
import type { $Response } from "express";
import type { THullRequest } from "hull";

const SyncAgent = require("../lib/sync-agent");
const REQUEST_PARAMS_FIELDS = require("../lib/defs/request-params-fields-def");

function requestParamsFields(req: THullRequest, res: $Response): $Response {
  return res.json({
    options: REQUEST_PARAMS_FIELDS
  });
}

module.exports = requestParamsFields;