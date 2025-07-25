import { Interceptor } from "./ui-extensibility";

export type QuickConnectOpenContext = { contactId: string | null };
export type QuickConnectOpenInterceptor = Interceptor<QuickConnectOpenContext>;
export type OutboundDialerOpenContext = { contactId: string | null };
export type OutboundDialerOpenInterceptor =
  Interceptor<OutboundDialerOpenContext>;
