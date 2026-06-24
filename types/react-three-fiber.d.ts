// React 19 + @react-three/fiber v9 require explicit JSX augmentation so
// that intrinsic elements like <mesh/>, <group/>, <ambientLight/>, etc.
// are recognised by TypeScript. R3F v9 stopped augmenting the global JSX
// namespace automatically.
//
// See: https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide

import { type ThreeElements } from '@react-three/fiber'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
