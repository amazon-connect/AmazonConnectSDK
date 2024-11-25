/**
 * Indicates if the quick responses feature is enabled for an
 * Amazon Connect instance. If it is enabled, the state will
 * also include a knowledge base id.
 */
export type QuickResponsesEnabledState =
  | {
      isEnabled: true;
      knowledgeBaseId: string;
    }
  | {
      isEnabled: false;
    };

/**
 * Request structure used to search quick responses.
 */
export type SearchQuickResponsesRequest = {
  /**
   * Queries are used to filter quick responses by {@link QuickResponsesQueryFieldName}.
   *
   * If no queries are provided, the client will return all quick responses associated with the agent's routing profile.
   */
  queries?: QuickResponsesQuery[];

  /**
   * The channels to filter the request by
   */
  channels: QuickResponseChannel[];

  /**
   * The user-defined Amazon Connect contact attributes to be resolved when search results are returned.
   */
  attributes?: Record<string, string>;

  /**
   * The default value is set to 250ms.
   *
   * Set it to 0 to disable debounced input change
   */
  debounceMS?: number;

  /**
   * The number of results to be returned.
   */
  maxResults?: number;

  /**
   * The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results.
   */
  nextToken?: string;
};

/**
 * The query expression used to search quick responses in {@link SearchQuickResponsesRequest}
 */
export type QuickResponsesQuery = {
  /**
   * The name of the attribute to query the quick responses by.
   */
  name: QuickResponsesQueryFieldName;

  /**
   * The values of the attribute to query the quick responses by.
   */
  values: string[];

  /**
   * The operator to use for matching attribute field values in the query.
   */
  operator: QuickResponsesQueryOperator;

  /**
   * The importance of the attribute field when calculating query result relevancy
   * scores. The value set for this parameter affects the ordering of search results.
   */
  priority?: QuickResponsesQueryPriority;

  /**
   * Whether the query expects only exact matches on the attribute field values.
   *
   * The results of the query will only include exact matches if this parameter
   * is set to false.
   */
  allowFuzziness?: boolean;
};

/**
 * The fields to query quick responses by
 */
export type QuickResponsesQueryFieldName =
  | "content"
  | "name"
  | "description"
  | "shortcutKey";

/**
 * The supported values to use when querying for matching quick responses
 */
export type QuickResponsesQueryOperator = "CONTAINS" | "CONTAINS_AND_PREFIX";

/**
 * The supported values to use when determining the relevancy score for a given query.
 */
export type QuickResponsesQueryPriority = "HIGH" | "MEDIUM" | "LOW";

export type SearchQuickResponsesResult = {
  /**
   * The results of the quick responses search.
   */
  results: QuickResponsesSearchResultData[];

  /**
   * The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results.
   */
  nextToken?: string;
};

/**
 * The result of quick responses search.
 */
export type QuickResponsesSearchResultData = {
  /**
   * The contents of the quick response.
   */
  contents: QuickResponseContents;

  /**
   * The identifier of the knowledge base.
   */
  knowledgeBaseId: string;

  /**
   * The name of the quick response.
   */
  name: string;
  /**
   * The Amazon Resource Name (ARN) of the quick response.
   */
  quickResponseArn: string;

  /**
   * The identifier of the quick response.
   */
  quickResponseId: string;

  /**
   * The description of the quick response.
   */
  description?: string;

  /**
   * The shortcut key of the quick response.
   *
   * The value should be unique across the knowledge base.
   */
  shortcutKey?: string;

  /**
   * The user defined contact attributes that are not resolved when the search result is returned.
   */
  attributesNotInterpolated?: string[];
};

/**
 * The content of the quick response stored in different media types.
 */
export type QuickResponseContents = {
  markdown?: string;
  plainText?: string;
};

/**
 * The supported values for channels to search quick responses by
 */
export type QuickResponseChannel = "Chat" | "Email";
