// @flow
import type {
  THullReqContext,
  THullUserUpdateMessage,
  THullConnector
} from "hull";

import type {
  HullMetrics,
  HullClient,
  PiplConnectorSettings,
  PiplRequestParams,
  PiplEnrichEnvelope,
  ServiceClientConfiguration,
  FilterUtilConfiguration
} from "./types";

const _ = require("lodash");

const FilterUtil = require("./utils/filter-util");
const MappingUtil = require("./utils/mapping-util");
const ServiceClient = require("./service-client");

const BASE_API_URL = "https://api.pipl.com";

class SyncAgent {
  hullMetric: HullMetrics;
  hullClient: HullClient;
  hullConnector: THullConnector;
  cache: Object;
  helpers: Object;
  privateSettings: PiplConnectorSettings;
  filterUtil: FilterUtil;
  mappingUtil: MappingUtil;
  piplClient: ServiceClient;

  constructor(reqContext: THullReqContext) {
    this.hullMetric = reqContext.metric;
    this.hullClient = reqContext.client;
    this.hullConnector = reqContext.connector;
    this.cache = reqContext.cache;
    this.helpers = reqContext.helpers;
    this.privateSettings = _.get(reqContext, "ship.private_settings");

    this.mappingUtil = new MappingUtil();

    const filterUtilConfiguration: FilterUtilConfiguration = {
      synchronizedUserSegments: this.privateSettings
        .synchronized_user_segments,
      cache: this.cache
    };
    this.filterUtil = new FilterUtil(filterUtilConfiguration);

    const piplClientConfiguration: ServiceClientConfiguration = {
      baseApiUrl: BASE_API_URL,
      hullMetric: this.hullMetric,
      hullLogger: this.hullClient.logger,
      apiKey: this.privateSettings.api_key,
      dailyRateLimit: this.privateSettings.pipl_daily_rate_limit,
      cache: this.cache
    };
    this.piplClient = new ServiceClient(piplClientConfiguration);
  }

  async buildPiplEnrichEnvelope(
    message: THullUserUpdateMessage
  ): Promise<PiplEnrichEnvelope> {
    const combinedUser = _.cloneDeep(message.user);
    combinedUser.account = _.cloneDeep(message.account);

    const piplRequestParams: PiplRequestParams = {
      first_name: _.get(combinedUser, this.privateSettings.user_first_name),
      last_name: _.get(combinedUser, this.privateSettings.user_last_name),
      email: _.get(combinedUser, this.privateSettings.user_email),
      match_requirements: this.privateSettings.pipl_match_requirements,
      country: _.get(combinedUser, this.privateSettings.user_country)
    };

    const envelope = {};
    envelope.message = message;
    envelope.hullUser = combinedUser;
    envelope.piplRequestParams = piplRequestParams;
    envelope.piplPerson = null;
    envelope.piplPersonCount = null;
    envelope.skipReason = null;
    envelope.error = null;

    return envelope;
  }

  async sendUserMessages(messages: Array<THullUserUpdateMessage>): Promise<*> {
    const deduplicatedMessages = this.filterUtil.deduplicateUserUpdateMessages(
      messages
    );

    const envelopes = await Promise.all(
      deduplicatedMessages.map(message => this.buildPiplEnrichEnvelope(message))
    );

    const filterResults = await this.filterUtil.filterUsers(envelopes);

    filterResults.toSkip.forEach(envelope => {
      this.hullClient
        .asUser(envelope.message.user)
        .logger.info("outgoing.user.skip", envelope.skipReason);
    });

    const updatedEnvelopes = await this.piplClient.piplEnrichEnvelopes(
      filterResults.toUpdate
    );

    await Promise.all(
      updatedEnvelopes.map(async updatedEnvelope => {
        try {
          if (!updatedEnvelope.piplPerson) {
            if (updatedEnvelope.piplMatch) {
              await this.hullClient
                .asUser(updatedEnvelope.message.user)
                .traits({"pipl/fetched_at": {
                  value: new Date(),
                  operation: "set"
                }});
              await this.cache.set(updatedEnvelope.hullUser.id, true);
            }

            throw new Error(updatedEnvelope.error || "No data found by pipl");
          }

          await this.hullClient
            .asUser(updatedEnvelope.message.user)
            .traits(
              this.mappingUtil.mapPiplPersonToHullUserAttributes(
                updatedEnvelope.piplPerson
              )
            ); 
          await this.cache.set(updatedEnvelope.hullUser.id, true);
          return this.hullClient
            .asUser(updatedEnvelope.message.user)
            .logger.info(
              "outgoing.user.success",
              updatedEnvelope.piplRequestParams
            );
        } catch (error) {
          return this.hullClient
            .asUser(updatedEnvelope.message.user)
            .logger.info("outgoing.user.error", error);
        }
      })
    );
  }

  isAuthenticationConfigured(): boolean {
    return this.piplClient.hasValidApiKey();
  }
}

module.exports = SyncAgent;
