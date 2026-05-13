// Public API of the `type-inference` feature.
//
// Only the page-level view is intentionally exported. Everything else
// (services, hooks, sub-components, internal types) stays private to the
// feature so the feature's boundary remains a small and explicit surface.

export { TypeInferenceApp } from "./components/TypeInferenceApp";
