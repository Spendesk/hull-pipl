/* @flow */
import type {
  HullAccount,
  HullUserIdent,
  HullAccountIdent,
  HullUserAttributes,
  HullAccountAttributes,
  HullUser,
  HullUserUpdateMessage
} from "hull";

export type HullMetrics = {
  increment(name: string, value: number, ...params: any[]): void,
  value(name: string, value: number, ...params: any[]): void
};

export type HullClientLogger = {
  log(message: ?any, ...optionalParams: any[]): void,
  info(message: ?any, ...optionalParams: any[]): void,
  warn(message: ?any, ...optionalParams: any[]): void,
  error(message: ?any, ...optionalParams: any[]): void,
  debug(message: ?any, ...optionalParams: any[]): void
};

export type HullClientConfiguration = {
  prefix: string,
  domain: string,
  protocol: string,
  id: string,
  secret: string,
  organization: string,
  version: string
};

export type HullClientApiOptions = {
  timeout: number,
  retry: number
};

export type HullClientUtilTraits = {
  group(user: HullUser | HullAccount): Object,
  normalize(traits: Object): HullUserAttributes
};

export type HullClientUtils = {
  traits: HullClientUtilTraits
};

export type HullClientTraitsContext = {
  source: string
};

export type HullFieldDropdownItem = {
  value: string,
  label: string
};

/**
 * This is an event name which we use when tracking an event
 */
export type HullEventName = string;

/**
 * This is are event's properties which we use when tracking an event
 */
export type HullEventProperties = {
  [HullEventProperty: string]: string
};

/**
 * This is additional context passed with event
 */
export type HullEventContext = {
  location?: {},
  page?: {
    referrer?: string
  },
  referrer?: {
    url: string
  },
  os?: {},
  useragent?: string,
  ip?: string | number
};

export type HullClient = {
  configuration: HullClientConfiguration,
  asUser(ident: HullUserIdent): HullClient,
  asAccount(ident: HullAccountIdent): HullClient,
  logger: HullClientLogger,
  traits(
    attributes: HullUserAttributes | HullAccountAttributes,
    context: HullClientTraitsContext
  ): Promise<any>, // Needs to be refined further
  track(
    event: string,
    properties: HullEventProperties,
    context: HullEventContext
  ): Promise<any>,
  get(
    url: string,
    params?: Object,
    options?: HullClientApiOptions
  ): Promise<any>,
  post(
    url: string,
    params?: Object,
    options?: HullClientApiOptions
  ): Promise<any>,
  put(
    url: string,
    params?: Object,
    options?: HullClientApiOptions
  ): Promise<any>,
  del(
    url: string,
    params?: Object,
    options?: HullClientApiOptions
  ): Promise<any>,
  account(ident: HullAccountIdent): HullClient,
  utils: HullClientUtils
};

/*
 * Pipl Types, specific for this connector 
 */

export type PiplParamsAttribute = {
  hull_field_name: string,
  pipl_field_name: string
};

export type PiplConnectorSettings = {
  api_key: string,
  synchronized_user_segments: Array<string>,
  pipl_params_attributes: Array<PiplParamsAttribute> ,
  pipl_daily_rate_limit: number,
  pipl_match_requirements: string
};

export type PiplPersonName = {
  first: string,
  last: string,
  display: string
};

export type PiplPersonEmail = {
  address: string
};

export type PiplPersonUsername = {
  content: string
};

export type PiplPersonPhone = {
  country_code: number,
  number: number,
  display: string,
  display_international: string
};

export type PiplPersonGender = {
  content: string
};

export type PiplPersonDateRange = {
  start: string,
  end?: string
};

export type PiplPersonBirthday = {
  date_range: PiplPersonDateRange,
  display: string
};

export type PiplPersonLanguage = {
  language: string,
  display: string
};

export type PiplPersonAddress = {
  country: string,
  state?: string,
  city?: string,
  zip_code?: string,
  street?: string,
  display: string
};

export type PiplPersonJob = {
  title: string,
  organization: string,
  date_range: PiplPersonDateRange,
  display: string
};

export type PiplPersonEducation = {
  degree: string,
  school: string,
  date_range: PiplPersonDateRange,
  display: string
};

export type PiplPersonImage = {
  url: string,
  thumbnail_token: string
};

export type PiplPersonUrl = {
  url: string
};

export type PiplPerson = {
  names: Array<PiplPersonName>,
  emails: Array<PiplPersonEmail>,
  usernames: Array<PiplPersonUsername>,
  phones: Array<PiplPersonPhone>,
  gender: PiplPersonGender,
  dob: PiplPersonBirthday,
  languages: Array<PiplPersonLanguage>,
  addresses: Array<PiplPersonAddress>,
  jobs: Array<PiplPersonJob>,
  educations: Array<PiplPersonEducation>,
  images: Array<PiplPersonImage>,
  urls: Array<PiplPersonUrl>
};

export type PiplResponse = {
  person?: PiplPerson
};

export type FilterUtilConfiguration = {
  synchronizedUserSegments: Array<string>,
  cache: Object,
};

export type FilterResults<T> = {
  toSkip: Array<T>,
  toUpdate: Array<T>
};

export type PiplRequestParams = {
  [string]: string
};

export type PiplEnrichEnvelope = {
  message: HullUserUpdateMessage,
  hullUser: HullUser,
  piplRequestParams: PiplRequestParams,
  piplPerson: PiplPerson | null,
  piplMatch: boolean,
  skipReason: string | null,
  error: string | null
};

export type ServiceClientConfiguration = {
  baseApiUrl: string,
  hullMetric: HullMetrics,
  hullLogger: HullClientLogger,
  apiKey: string,
  dailyRateLimit: number,
  cache: object
};
