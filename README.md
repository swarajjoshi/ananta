# ANANTA (Windows + VS Code + Live Server)
## Replace the old project
1. Close the old browser tab. In VS Code: File → Close Folder.
2. Delete (or rename) the old `ananta` folder. Right-click the new `ananta.zip` → Extract All.
3. VS Code → File → Open Folder → the new `ananta` folder (it must contain `index.html`, `css`, `js`, `tests`).
4. Right-click `index.html` → **Open with Live Server**. Press **Ctrl+Shift+R** once to clear the old cached copy.
(Live Server extension: Extensions icon → search "Live Server" by Ritwick Dey → Install. Don't double-click index.html.)
## Try the two changes
- **Verses:** with only 2 verses in the library you will still see just those 2; that is the library size, not the code. See `VERSES.md` to add more. Tests prove the selector uses a whole library.
- **Sacred Circle:** Begin → Enable Camera. Normal thumb+index pinches count. To finish: touch thumb to MIDDLE fingertip, keep the other fingers out, hold 2 seconds; a bar fills and the status shows a countdown. "Finish Session" always works.
## Tests (needs Node.js LTS): VS Code Terminal → `npm test`
## Tune the gesture: `js/gesture.js` → `CFG` (`circleOn` bigger = easier to trigger, `circleMs` = hold time, `circleFrames`, `circleIdxMin`, `circleExtMin`).
## Deploy free: GitHub Pages (upload all folders, Settings → Pages → main / root).
## Status: automated logic tests only. Not tested with a real camera.
