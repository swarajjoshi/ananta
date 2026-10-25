# Verse library: status and how to grow it
**Current: 2 entries (2.47, 18.66). Verified against a named source: 0. Provisional: 2.** I typed the Sanskrit and Hindi myself; they have not been checked against a source. The Hindi lines are my own renderings, not quotations from a published translation.

## Adding verses safely
1. Pick a Sanskrit/transliteration source and a Hindi translation source you are allowed to reuse. Check each licence (a "MIT" label on a dataset page does not automatically cover the translator's copyright).
   Candidates I saw but have NOT checked or imported: github.com/vedicscriptures/bhagavad-gita-data, huggingface.co/datasets/OEvortex/Bhagavad_Gita.
2. Copy an entry in `js/verses.js`, set id `bg-<chapter>-<verse>`, fill `lines` (one per line of the verse), `hindi`, and the two source fields.
3. Compare against the source by eye, then set `status:'verified'`.
4. Run `npm test`. Once any entry is verified, the app uses ONLY verified entries.
With few verses the same ones repeat; the no-repeat window grows automatically (up to 20 recent) as the library grows.
