import { useGLTF } from '@react-three/drei'

// Self-host the Draco decoder (public/draco/) instead of drei's default
// gstatic CDN. Set globally, and imported first in main.tsx so it runs before
// any page module can preload a Draco GLB with the CDN default. Purely an
// infra change — no visual/behavior difference on any device.
useGLTF.setDecoderPath('/draco/')
