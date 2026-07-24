import { AmazonConnectProvider } from "@amazon-connect/core";
import {
  ExtensibilityService,
  Interceptor,
  RegisterInterceptorOptions,
} from "@amazon-connect/extensibility";

/**
 * The interceptor keys backed by contact-scoped `add*Interceptor` methods. The
 * generic `InterceptorKey` is just `string`; this union constrains the keys
 * this service actually forwards, giving the internal registration path
 * compile-time safety against typos.
 */
export type ContactInterceptorKey =
  | "openQuickConnect"
  | "openOutboundDialer"
  | "clearContact";

/**
 * Invocation context shared by the contact-scoped UI interceptor actions
 * (`openQuickConnect`, `openOutboundDialer`, `clearContact`). The `contactId`
 * identifies the contact the action applies to when one is in scope; it is
 * absent for actions initiated outside of a specific contact.
 */
export type ContactInterceptorContext = {
  contactId?: string;
};

/**
 * Contact-specific sugar over the generic `@amazon-connect/extensibility`
 * interceptor pipeline. Each method targets one contact/CCP UI action, bakes
 * in its interceptor key, and types the callback context as
 * {@link ContactInterceptorContext} so callers never handle the raw key or an
 * untyped context.
 *
 * A scoped interceptor takes its `contactId` as a positional argument on both
 * the `add*` and `remove*` methods, so `removeX(fn, contactId)` mirrors
 * `addX(fn, contactId)` and an interceptor is torn down with the same argument
 * that identifies it. The `contactId` identifies the registration; the trailing
 * options object only tunes behavior (`timeout`, `maxConsecutiveBlocks`).
 *
 * This is the contact team's typed surface over the generic
 * `ExtensibilityService`; other UI-owning teams expose their own equivalent
 * from their own SDK packages.
 */
export class ContactInterceptorService {
  private readonly extensibility: ExtensibilityService;

  constructor(provider: AmazonConnectProvider) {
    this.extensibility = new ExtensibilityService(provider);
  }

  /**
   * Registers an interceptor for the `openQuickConnect` action, which fires
   * when the user chooses the Quick Connect or transfer button.
   *
   * Return `{ continue: false }` (or `false`) to block the built-in Quick
   * Connect experience — for example, to present your own transfer UI — or
   * `{ continue: true }` (or `true`) to allow it to proceed.
   *
   * @param interceptor Callback invoked with `{ contactId?: string }` before
   * the default action runs.
   * @param options Optional registration options (`timeout`,
   * `maxConsecutiveBlocks`).
   * @returns A promise that resolves once the interceptor is registered.
   */
  addOpenQuickConnectInterceptor(
    interceptor: Interceptor<ContactInterceptorContext>,
    options?: RegisterInterceptorOptions,
  ): Promise<void>;
  /**
   * @param interceptor Callback invoked with `{ contactId?: string }` before
   * the default action runs.
   * @param contactId Contact ID to scope the interceptor to a single contact.
   * The same `contactId` must be passed to
   * {@link removeOpenQuickConnectInterceptor} to unregister it.
   * @param options Optional registration options (`timeout`,
   * `maxConsecutiveBlocks`).
   */
  addOpenQuickConnectInterceptor(
    interceptor: Interceptor<ContactInterceptorContext>,
    contactId: string,
    options?: RegisterInterceptorOptions,
  ): Promise<void>;
  addOpenQuickConnectInterceptor(
    interceptor: Interceptor<ContactInterceptorContext>,
    contactIdOrOptions?: string | RegisterInterceptorOptions,
    options?: RegisterInterceptorOptions,
  ): Promise<void> {
    return this.registerContactInterceptor(
      "openQuickConnect",
      interceptor,
      contactIdOrOptions,
      options,
    );
  }

  /**
   * Unregisters an interceptor previously registered with
   * {@link addOpenQuickConnectInterceptor}. The `interceptor` reference and
   * `contactId` must match the values supplied at registration — a scoped
   * interceptor added with a `contactId` is only removed when the same
   * `contactId` is passed here.
   *
   * @param interceptor The interceptor function reference to remove.
   * @param contactId The contact ID the interceptor was scoped to, if any.
   * @returns A promise that resolves once the interceptor is removed.
   */
  removeOpenQuickConnectInterceptor(
    interceptor: Interceptor<ContactInterceptorContext>,
    contactId?: string,
  ): Promise<void> {
    return this.extensibility.removeInterceptor(
      "openQuickConnect",
      interceptor,
      contactId,
    );
  }

  /**
   * Registers an interceptor for the `openOutboundDialer` action, which fires
   * when the user chooses the number pad or outbound dialer.
   *
   * Return `{ continue: false }` (or `false`) to block the built-in outbound
   * dialer — for example, to present your own dialer UI — or
   * `{ continue: true }` (or `true`) to allow it to proceed.
   *
   * @param interceptor Callback invoked with `{ contactId?: string }` before
   * the default action runs.
   * @param options Optional registration options (`timeout`,
   * `maxConsecutiveBlocks`).
   * @returns A promise that resolves once the interceptor is registered.
   */
  addOpenOutboundDialerInterceptor(
    interceptor: Interceptor<ContactInterceptorContext>,
    options?: RegisterInterceptorOptions,
  ): Promise<void>;
  /**
   * @param interceptor Callback invoked with `{ contactId?: string }` before
   * the default action runs.
   * @param contactId Contact ID to scope the interceptor to a single contact.
   * The same `contactId` must be passed to
   * {@link removeOpenOutboundDialerInterceptor} to unregister it.
   * @param options Optional registration options (`timeout`,
   * `maxConsecutiveBlocks`).
   */
  addOpenOutboundDialerInterceptor(
    interceptor: Interceptor<ContactInterceptorContext>,
    contactId: string,
    options?: RegisterInterceptorOptions,
  ): Promise<void>;
  addOpenOutboundDialerInterceptor(
    interceptor: Interceptor<ContactInterceptorContext>,
    contactIdOrOptions?: string | RegisterInterceptorOptions,
    options?: RegisterInterceptorOptions,
  ): Promise<void> {
    return this.registerContactInterceptor(
      "openOutboundDialer",
      interceptor,
      contactIdOrOptions,
      options,
    );
  }

  /**
   * Unregisters an interceptor previously registered with
   * {@link addOpenOutboundDialerInterceptor}. The `interceptor` reference and
   * `contactId` must match the values supplied at registration — a scoped
   * interceptor added with a `contactId` is only removed when the same
   * `contactId` is passed here.
   *
   * @param interceptor The interceptor function reference to remove.
   * @param contactId The contact ID the interceptor was scoped to, if any.
   * @returns A promise that resolves once the interceptor is removed.
   */
  removeOpenOutboundDialerInterceptor(
    interceptor: Interceptor<ContactInterceptorContext>,
    contactId?: string,
  ): Promise<void> {
    return this.extensibility.removeInterceptor(
      "openOutboundDialer",
      interceptor,
      contactId,
    );
  }

  /**
   * Registers an interceptor for the `clearContact` action, which fires when
   * the user chooses to clear or end a contact.
   *
   * Return `{ continue: false }` (or `false`) to block clearing the contact —
   * for example, to require a disposition code first — or `{ continue: true }`
   * (or `true`) to allow it to proceed.
   *
   * @param interceptor Callback invoked with `{ contactId?: string }` before
   * the default action runs.
   * @param options Optional registration options (`timeout`,
   * `maxConsecutiveBlocks`).
   * @returns A promise that resolves once the interceptor is registered.
   */
  addClearContactInterceptor(
    interceptor: Interceptor<ContactInterceptorContext>,
    options?: RegisterInterceptorOptions,
  ): Promise<void>;
  /**
   * @param interceptor Callback invoked with `{ contactId?: string }` before
   * the default action runs.
   * @param contactId Contact ID to scope the interceptor to a single contact.
   * The same `contactId` must be passed to {@link removeClearContactInterceptor}
   * to unregister it.
   * @param options Optional registration options (`timeout`,
   * `maxConsecutiveBlocks`).
   */
  addClearContactInterceptor(
    interceptor: Interceptor<ContactInterceptorContext>,
    contactId: string,
    options?: RegisterInterceptorOptions,
  ): Promise<void>;
  addClearContactInterceptor(
    interceptor: Interceptor<ContactInterceptorContext>,
    contactIdOrOptions?: string | RegisterInterceptorOptions,
    options?: RegisterInterceptorOptions,
  ): Promise<void> {
    return this.registerContactInterceptor(
      "clearContact",
      interceptor,
      contactIdOrOptions,
      options,
    );
  }

  /**
   * Unregisters an interceptor previously registered with
   * {@link addClearContactInterceptor}. The `interceptor` reference and
   * `contactId` must match the values supplied at registration — a scoped
   * interceptor added with a `contactId` is only removed when the same
   * `contactId` is passed here.
   *
   * @param interceptor The interceptor function reference to remove.
   * @param contactId The contact ID the interceptor was scoped to, if any.
   * @returns A promise that resolves once the interceptor is removed.
   */
  removeClearContactInterceptor(
    interceptor: Interceptor<ContactInterceptorContext>,
    contactId?: string,
  ): Promise<void> {
    return this.extensibility.removeInterceptor(
      "clearContact",
      interceptor,
      contactId,
    );
  }

  /**
   * Shared registration path for the contact-scoped `add*Interceptor` methods.
   * Disambiguates the optional positional `contactId` from the optional
   * `options` object and dispatches to the matching generic `addInterceptor`
   * overload.
   */
  private registerContactInterceptor(
    interceptorKey: ContactInterceptorKey,
    interceptor: Interceptor<ContactInterceptorContext>,
    contactIdOrOptions?: string | RegisterInterceptorOptions,
    options?: RegisterInterceptorOptions,
  ): Promise<void> {
    return typeof contactIdOrOptions === "string"
      ? this.extensibility.addInterceptor<ContactInterceptorContext>(
          interceptorKey,
          interceptor,
          contactIdOrOptions,
          options,
        )
      : this.extensibility.addInterceptor<ContactInterceptorContext>(
          interceptorKey,
          interceptor,
          contactIdOrOptions,
        );
  }
}
