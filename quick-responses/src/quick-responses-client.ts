import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { quickResponsesNamespace } from "./quick-responses-namespace";
import { QuickResponsesRoute } from "./routes";
import {
  QuickResponsesEnabledState,
  SearchQuickResponsesRequest,
  SearchQuickResponsesResult,
} from "./types";

export class QuickResponsesClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(quickResponsesNamespace, config);
  }

  /**
   * Determine whether Quick Responses is enabled for this instance.
   *
   * If Quick Responses is enabled, returns the knowledge base id as well
   *
   * @returns {Promise<QuickResponsesEnabledState>} A promise that resolves to an object that indicates if the quick responses feature is enabled
   */
  isEnabled(): Promise<QuickResponsesEnabledState> {
    return this.context.proxy.request(QuickResponsesRoute.isEnabled);
  }

  /**
   * Sends a request to retrieve a list of quick responses.
   *
   * @param {SearchQuickResponsesRequest} queryRequest request to search quick responses.
   *
   * @returns {Promise<SearchQuickResponsesResult>} A promise that resolves to an array of search results and a next token
   */
  searchQuickResponses(
    queryRequest: SearchQuickResponsesRequest,
  ): Promise<SearchQuickResponsesResult> {
    return this.context.proxy.request(
      QuickResponsesRoute.searchQuickResponses,
      queryRequest,
    );
  }
}
