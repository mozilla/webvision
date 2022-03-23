
# Instructions for publishing a new version

- Update `input/summary.md` and `input/full.md`
- Run: `node build.js`
- To test locally: `python3 -m http.server --directory docs`

# Protocol design library

This uses https://protocol.mozilla.org. To re-vendor it in:

```
rm -r docs/mozilla-protocol
mkdir -p docs/mozilla-protocol/css docs/mozilla-protocol/fonts docs/mozilla-protocol/img/logos/mozilla
cp node_modules/@mozilla-protocol/core/protocol/css/protocol.css docs/mozilla-protocol/css/
cp node_modules/@mozilla-protocol/core/protocol/css/protocol.css.map docs/mozilla-protocol/css/
cp node_modules/@mozilla-protocol/core/protocol/css/protocol-components.css docs/mozilla-protocol/css/
cp -R node_modules/@mozilla-protocol/core/protocol/fonts docs/mozilla-protocol/
cp node_modules/@mozilla-protocol/core/protocol/img/logos/mozilla/*.svg docs/mozilla-protocol/img/logos/mozilla
```
