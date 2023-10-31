# Amazon Connect SDK - Theme

The theme package defines and applies the Connect theme when developing with Cloudscape.

## Installation

```
% npm install -P @amazon-connect/theme
```

## Usage

The theme package must be imported once at the entry point of the application.


**src/index.ts**

```
import { applyConnectTheme } from "@amazon-connect/theme";

applyConnectTheme();
```

From then on cloudscape components and design tokens can be used directly from Cloudscape.

**src/App.ts**

```
import * as React from "react";
import Button from "@cloudscape-design/components/button";

export default () => {
  return <Button variant="primary">Button</Button>;
}
```

## Theme customizations

The following customizations can be passed to `applyConnectTheme` to adapt Cloudscape components to your own
visual brand:

- `fontFamily`: The default font family that will be applied globally to the product interface.
- `brandColor`: The primary brand color used for buttons, links and form controls.
- `brandColorActive`: Slightly lighter or darker version brand color, applied when brand color elements become active, focused or hovered.

Colors can be a simple string or both `light` and `dark` values, which apply respectively to light mode and dark mode:

```
import { applyConnectTheme } from "@amazon-connect/theme";

applyConnectTheme({
  brandColor: "#CA1CCA",
  brandColorActive: { light: "B519B5", dark: "CF32CF" }
});
```
