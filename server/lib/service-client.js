/* @flow */
import type {
  HullMetrics,
  HullClientLogger,
  PiplRequestParams,
  PiplEnrichEnvelope,
  ServiceClientConfiguration
} from "./types";

const _ = require("lodash");
const moment = require("moment");

const superagent = require("superagent");
const SuperagentThrottle = require("superagent-throttle");

const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin,
  superagentErrorPlugin
} = require("hull/lib/utils");
const { ConfigurationError } = require("hull/lib/errors");

const throttlePool = {};

class ServiceClient {
  urlPrefix: string;
  hullMetric: HullMetrics;
  hullLogger: HullClientLogger;
  apiKey: string;
  agent: superagent;
  dailyRateLimit: number;
  cache: Object;

  constructor(config: ServiceClientConfiguration) {
    this.urlPrefix = config.baseApiUrl;
    this.hullMetric = config.hullMetric;
    this.hullLogger = config.hullLogger;
    this.apiKey = config.apiKey;
    this.dailyRateLimit = config.dailyRateLimit;
    this.cache = config.cache;

    throttlePool[this.apiKey] =
      throttlePool[this.apiKey] ||
      new SuperagentThrottle({
        rate: parseInt(process.env.THROTTLE_RATE, 10) || 40, // how many requests can be sent every `ratePer`
        ratePer: parseInt(process.env.THROTTLE_RATE_PER, 10) || 1000 // number of ms in which `rate` requests may be sent
      });

    const throttle = throttlePool[this.apiKey];

    this.agent = superagent
      .agent()
      .use(throttle.plugin())
      .redirects(0)
      .use(superagentErrorPlugin({ timeout: 10000 }))
      .use(superagentUrlTemplatePlugin())
      .use(
        superagentInstrumentationPlugin({
          logger: this.hullLogger,
          metric: this.hullMetric
        })
      );
  }

  async piplEnrich(params: PiplRequestParams): Promise<*> {
    if (!this.hasValidApiKey()) {
      throw new ConfigurationError("No API key specified in the Settings.", {});
    }

    if (
      await this.getDailyRate() === this.dailyRateLimit
    ) {
      throw new Error("Pipl daily rate limit is reached.");
    }

    const piplParams = _.merge(
      params,
      { key: this.apiKey }
    );

    return await this.agent
      .get(`${this.urlPrefix}/search`)
      .query(_.pickBy(piplParams, _.identity));
  }

  piplEnrichEnvelopes(
    envelopes: Array<PiplEnrichEnvelope>
  ): Promise<Array<PiplEnrichEnvelope>> {
    return Promise.all(
      envelopes.map(envelope => {
        const enrichedEnvelope = _.cloneDeep(envelope);
        return this.piplEnrich(envelope.piplRequestParams)
          .then(async response => {
            enrichedEnvelope.piplPersonCount = response.body["@persons_count"];
            enrichedEnvelope.piplPerson = response.body.person;

            if(enrichedEnvelope.piplPersonCount != 0) {
              await this.incrementDailyRate();
            }

            return enrichedEnvelope;
          })
          .catch(error => {
            enrichedEnvelope.error = error.response.body;
            return enrichedEnvelope;
          });
      })
    );
  }

  dailyRateCacheKey(): string {
    return moment(new Date()).format("YYYY-MM-DD");
  }

  async getDailyRate(): Promise<number> {
    return await this.cache.get(this.dailyRateCacheKey());
  }

  async incrementDailyRate(): Promise<number> {
    return await this.cache.set(
      this.dailyRateCacheKey(),
      await this.getDailyRate() + 1
    )
  }

  hasValidApiKey(): boolean {
    if (_.isNil(this.apiKey)) {
      return false;
    }

    return (
      _.isString(this.apiKey) &&
      this.apiKey.length > 5
    )
  }
}

module.exports = ServiceClient;
