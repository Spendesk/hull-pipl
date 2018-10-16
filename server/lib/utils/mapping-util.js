/* @flow */
import type { THullUserAttributes } from "hull";
import type { PiplPerson } from "../types";

const _ = require("lodash");
const freeEmailDomains = require("../defs/free-email-domains-def");

class MappingUtil {
  piplArrayAttributes: Array<string>;

  constructor() {
    this.piplArrayAttributes = [
      "usernames",
      "phones",
      "languages",
      "addresses",
      "jobs",
      "educations",
      "images",
      "urls"
    ];
  }

  mapPiplPersonToHullUserAttributes(person: PiplPerson): THullUserAttributes {
    const hullUserAttributes: THullUserAttributes = {};

    hullUserAttributes["pipl/fetched_at"] = {
      value: new Date(),
      operation: "set"
    };

    hullUserAttributes["pipl/first_name"] = {
      value: _.get(person, "names[0].first", null),
      operation: "set"
    };

    hullUserAttributes["pipl/last_name"] = {
      value: _.get(person, "names[0].last", null),
      operation: "set"
    };

    hullUserAttributes["pipl/full_name"] = {
      value: _.get(person, "names[0].display", null),
      operation: "set"
    };

    hullUserAttributes["pipl/birthday_date"] = {
      value: _.get(person, "dob.date_range.start", null),
      operation: "set"
    };

    hullUserAttributes["pipl/gender"] = {
      value: _.get(person, "gender.content", null),
      operation: "set"
    };

    const workEmails = _.filter(_.get(person, "emails", []), email => {
      return !freeEmailDomains.includes(email.address.split("@")[1]);
    });

    hullUserAttributes["pipl/work_emails"] = {
      value: _.map(workEmails, workEmail => {
        return workEmail.address;
      }),
      operation: "set"
    };

    const personalEmails = _.filter(_.get(person, "emails", []), email => {
      return freeEmailDomains.includes(email.address.split("@")[1]);
    });

    hullUserAttributes["pipl/personal_emails"] = {
      value: _.map(personalEmails, personalEmail => {
        return personalEmail.address;
      }),
      operation: "set"
    };

    _.each(this.piplArrayAttributes, piplArrayAttribute => {
      let piplSubAttribute;

      switch (piplArrayAttribute) {
        case "images":
        case "urls":
          piplSubAttribute = "url";
          break;
        case "usernames":
          piplSubAttribute = "content";
          break;
        case "phones":
          piplSubAttribute = "display_international";
          break;
        case "languages":
          piplSubAttribute = "language";
          break;
        default:
          piplSubAttribute = "display";
      }

      hullUserAttributes[`pipl/${piplArrayAttribute}`] = {
        value: _.map(_.get(person, piplArrayAttribute, []), piplSubAttribute),
        operation: "set"
      };
    });

    return hullUserAttributes;
  }
}

module.exports = MappingUtil;
