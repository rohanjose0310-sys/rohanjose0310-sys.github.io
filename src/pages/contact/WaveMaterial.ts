import { Vector2 } from 'three'
import { shaderMaterial } from '@react-three/drei'

// Port of pmndrs/examples demos/shader-hmr WaveMaterial (MIT).
// Shader tutorial credit: https://www.youtube.com/watch?v=f4s1h2YETNY
// Changes from the demo: cos-palette retuned from rainbow to ember/orange on
// black, and the fract() tiling raised 1.5 -> 3.0 for more repeated cells.
export const WaveMaterial = shaderMaterial(
  {
    time: 0,
    resolution: new Vector2(),
    pointer: new Vector2(),
  },
  /*glsl*/ `
      varying vec2 vUv;
      void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectionPosition = projectionMatrix * viewPosition;
        gl_Position = projectionPosition;
        vUv = uv;
      }`,
  /*glsl*/ `
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 pointer;
      varying vec2 vUv;

      vec3 palette(float t) {
        // Ember ramp: oscillates deep burnt orange <-> bright accent orange.
        vec3 a = vec3(0.50, 0.22, 0.03);
        vec3 b = vec3(0.50, 0.26, 0.06);
        vec3 c = vec3(1.0, 1.0, 1.0);
        vec3 d = vec3(0.05, 0.10, 0.20);
        return a + b * cos(6.28318 * (c * t + d));
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / resolution.y;
        vec2 uv0 = uv;
        vec3 finalColor = vec3(0.0);
        uv = fract(uv * 3.0) - 0.5;
        uv = sin(uv * 0.5) - pointer;
        float d = length(uv) * exp(-length(uv0));
        vec3 col = palette(length(uv0) + time * 0.4);
        d = sin(d * 8.0 + time) / 8.0;
        d = abs(d);
        d = pow(0.02 / d, 2.0);
        finalColor += col * d;
        gl_FragColor = vec4(finalColor, 1.0);
      }`,
)
