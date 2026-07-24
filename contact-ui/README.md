# @amazon-connect/contact-ui

Contact-scoped UI action interceptors for the Amazon Connect SDK. Provides a
typed surface over the generic `@amazon-connect/extensibility` interceptor
pipeline for the built-in contact/CCP UI actions (Quick Connect, outbound
dialer, and clearing a contact).

## Installation

```bash
npm install @amazon-connect/contact-ui
```

## Usage

```typescript
import { ContactInterceptorService } from "@amazon-connect/contact-ui";

const interceptors = new ContactInterceptorService(provider);

// Require a disposition code before a contact is cleared.
await interceptors.addClearContactInterceptor(async ({ contactId }) => {
  const hasDisposition = await checkDisposition(contactId);
  return { continue: hasDisposition };
});
```

## API Reference

Documentation will be added as the package develops.
