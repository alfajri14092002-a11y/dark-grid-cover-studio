// Dark Grid Cover Studio — entry point. Builds the editor, then hands over
// to the screenshot scene runner when ?shot= is present.

import { freshState } from './state.js';
import { createEditor } from './editor.js';
import { runShotScene } from './shots.js';

const state = freshState();
const editor = createEditor(document, state);

runShotScene(state, editor).then((isShot) => {
  if (!isShot) window.__shotReady = true;
});
