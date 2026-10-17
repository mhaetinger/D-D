import * as abilities from './abilities';
import * as guidance from './guidance';
import * as drafts from './draft-store';
import { sheetStore } from '../storage/character-store';
(globalThis as any).CharacterGuide = { ...abilities, ...guidance, ...drafts, completeDraft: () => { if (!sheetStore.issue) drafts.clearDraft(); } };
