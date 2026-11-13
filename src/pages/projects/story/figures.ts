import type { StoryBlock } from './types'

/** How many figure numbers a block uses. */
export function figureCount(block: StoryBlock): number {
  switch (block.kind) {
    case 'image':
    case 'split':
    case 'video':
      return 1
    case 'grid':
      return block.images.length
    default:
      return 0
  }
}
