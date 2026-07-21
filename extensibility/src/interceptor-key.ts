/**
 * A string identifier for an interceptable action. Not an enum — the new
 * packages are intentionally action-agnostic, so any caller (internal or 3P)
 * can register and invoke interceptors under any string key.
 */
export type InterceptorKey = string;
