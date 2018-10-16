/* @flow */
import type { THullUserUpdateMessage } from "hull";
import type { PiplEnrichEnvelope, FilterUtilConfiguration, FilterResults } from "../types";

const _ = require("lodash");
const  Promise = require("bluebird");

class FilterUtil {
  synchronizedUserSegments: Array<string>;
  cache: Object;

  constructor(config: FilterUtilConfiguration) {
    this.synchronizedUserSegments = config.synchronizedUserSegments || [];
    this.cache = config.cache;
  }

  async filterUsers(
    envelopes: Array<PiplEnrichEnvelope>
  ): Promise<FilterResults<PiplEnrichEnvelope>> {
    const results: FilterResults<PiplEnrichEnvelope> = {
      toSkip: [],
      toUpdate: []
    };

    await Promise.each(envelopes, async (envelope: PiplEnrichEnvelope) => {
      if (!this.matchesSynchronizedUserSegments(envelope)) {
        envelope.skipReason =
          "The Hull user is not part of any whitelisted segment and won't be synchronized with Pipl.";

        return results.toSkip.push(envelope);
      }

      const cacheIsUpdatedUser = await this.cache.get(envelope.hullUser.id);
      if (
        cacheIsUpdatedUser ||
        _.has(envelope.hullUser, "traits_pipl/fetched_at")
      ) {
        envelope.skipReason = "The Hull user is already enrich by Pipl.";
        return results.toSkip.push(envelope);
      }

      if (!this.hasEnoughInformationToEnrich(envelope)) {
        envelope.skipReason =
          "The Hull user has contains not enough information to be enriched by Pipl.";
        return results.toSkip.push(envelope);
      }

      return results.toUpdate.push(envelope);
    });

    return results;
  }

  matchesSynchronizedUserSegments(envelope: PiplEnrichEnvelope): boolean {
    const msgSegmentIds: Array<string> = _.get(
      envelope,
      "message.segments",
      []
    ).map(s => s.id);

    return (
      _.intersection(msgSegmentIds, this.synchronizedUserSegments).length > 0
    );
  }

  hasEnoughInformationToEnrich(envelope: PiplEnrichEnvelope): boolean {
    const hullUser = envelope.hullUser;
    const piplRequestParams = envelope.piplRequestParams;

    return (
      !_.isEmpty(piplRequestParams.email) ||
      !_.isEmpty(piplRequestParams.phone) ||
      !_.isEmpty(piplRequestParams.username) ||
      !_.isEmpty(piplRequestParams.user_id) ||
      !_.isEmpty(piplRequestParams.url) ||
      (!_.isEmpty(piplRequestParams.first_name) && !_.isEmpty(piplRequestParams.last_name))
    );
  }

  deduplicateUserUpdateMessages(
    messages: Array<THullUserUpdateMessage>
  ): Array<THullUserUpdateMessage> {
    return _.chain(messages)
      .groupBy("user.id")
      .map(
        (
          groupedMessages: Array<THullUserUpdateMessage>
        ): THullUserUpdateMessage => {
          const dedupedMessage = _.cloneDeep(
            _.last(_.sortBy(groupedMessages, ["user.indexed_at"]))
          );

          const hashedEvents = {};
          groupedMessages.forEach((m: THullUserUpdateMessage) => {
            _.get(m, "events", []).forEach((e: Object) => {
              _.set(hashedEvents, e.event_id, e);
            });
          });

          dedupedMessage.events = _.values(hashedEvents);

          return dedupedMessage;
        }
      )
      .value();
  }
}

module.exports = FilterUtil;
