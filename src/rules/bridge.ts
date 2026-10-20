import * as combat from './combat';
import * as resources from './resources';
import * as spells from './spellcasting';
import { takeRest } from './rest';
import * as effects from './spell-effects';
import * as health from './health';
import { readableText } from './text';
import { setupRuleUI } from './ui';
export function initializeRules() {
  const root = window as any, E = root.CharacterEngine;
  // Conserva contratos públicos; criação/evolução continuam no motor anterior.
  E.weaponStats = (char:any,entry:any) => combat.weaponStats(char,entry,E);
  const movement = E.movementSpeed;
  E.movementSpeed = (char:any) => combat.movementWithEffects(char,movement(char));
  const format = root.RuleTooltips.formatText;
  root.RuleTooltips.formatText = (value:unknown) => format(readableText(value));
  root.CritCallRules = { ...combat, ...resources, ...spells, ...effects, ...health, takeRest, readableText };
  setupRuleUI(E);
}
