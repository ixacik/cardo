# Repository Agent Rules

## Styling System (Strict)

- Use Uniwind utilities for all styling.
- Do not use React Native `StyleSheet`.
- Do not call `StyleSheet.create` or `StyleSheet.hairlineWidth`.
- Standardize spacing, colors, and theming through Uniwind classes and tokens defined in `global.css`.
- Avoid one-off inline color or spacing values. If a value is reusable, add a token in `global.css` and consume it via class names.
- Inline style objects are only allowed for runtime-calculated values that cannot be expressed in classes (for example, animated transforms or safe-area offsets).
