import type { ContentPackDemoProps } from '../platform/ContentPackDemo'
import type { GlossaryPack } from '../platform/contracts'
import { botanyEnglishGlossaryPack, botanyGlossaryPack, botanyLearningPack } from './botany/sample-pack'

/** Register independent sample packs here; the application resolves them by key. */
export const contentPackDemos: Record<string, ContentPackDemoProps> = {
  botany: {
    demoPackId: 'botany',
    learningPack: botanyLearningPack,
    glossaryPack: botanyGlossaryPack,
  },
}

/** Single-runtime examples, kept separate from the integrated course demo. */
export const standaloneGlossaryDemos: Record<string, GlossaryPack> = {
  'botany-en': botanyEnglishGlossaryPack,
}
