# Draco decoder

Copied from Three.js 0.186.1 `examples/jsm/libs/draco/gltf`.
Upstream: https://github.com/google/draco
License: Apache-2.0, included in LICENSE.txt.

The application self-hosts the WASM decoder, wrapper and JavaScript fallback.
No external decoder CDN is used. The loader uses at most one worker per room.
