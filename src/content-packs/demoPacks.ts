import type { ContentPackDemoProps } from '../platform/ContentPackDemo'
import { botanyGlossaryPack, botanyLearningPack } from './botany/sample-pack'

/** Register independent sample packs here; the application resolves them by key. */
export const contentPackDemos: Record<string, ContentPackDemoProps> = {
  botany: {
    demoPackId: 'botany',
    learningPack: botanyLearningPack,
    glossaryPack: botanyGlossaryPack,
  },
}
