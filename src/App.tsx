// Composition root.
//
// `App` is intentionally trivial: it just renders the two top-level
// features. Each feature is self-contained — it provides its own page-level
// view component, owns its own state via its controller hook, and depends
// only on its own services.
//
// Styles are imported here once for the whole tree.

import "./App.css";
import { TypeInferenceApp } from "./features/type-inference";
import { HelpFab } from "./features/help";

function App() {
  return (
    <>
      <TypeInferenceApp />
      <HelpFab />
    </>
  );
}

export default App;
