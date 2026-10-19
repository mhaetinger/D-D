import { exhaustion } from './combat';
import { resetResources } from './resources';
import type { Engine, Sheet } from './model';
export function takeRest(c: Sheet, kind:'short'|'long', E: Engine, options={foodAndWater:true,tableHitDice:false}, random=Math.random) {
  if (Number(c.exhaustion)>=6) throw new Error('Exaustão 6 significa morte. Um descanso não revive o personagem.');
  if (kind==='long' && c.hpCurrent<1) return false; // Requisito do início, sem consumir/recuperar nada.
  resetResources(c,kind,E,random);
  if (Number(c.exhaustion)>=6) { c.hpCurrent=0; return false; }
  c.pactMagic.used = 0;
  for (const s of c.spells) if (s.recovery==='short' || kind==='long' && s.limitedUse) s.usesUsed = 0;
  if (kind==='long') {
    if (options.foodAndWater) c.exhaustion = Math.max(0,Number(c.exhaustion || 0)-1);
    c.hpCurrent = exhaustion(c).hpMax; c.hpTemp = 0; c.hpTempSource = '';
    c.sorceryPoints.current = c.sorceryPoints.max;
    for (const s of Object.values(c.standardSlots) as Sheet[]) { s.total -= s.created || 0; s.created = 0; s.used = 0; }
    if (options.tableHitDice) for (const cls of c.classes) cls.hitDiceUsed = 0;
    else {
      // A escolha de quais Dados recuperar, em multiclasse, fica explícita na UI.
      c.ruleState.hitDiceRecovery = Math.min(c.classes.reduce((sum:number,x:Sheet)=>sum+(x.hitDiceUsed || 0),0),Math.max(1,Math.floor(c.classes.reduce((sum:number,x:Sheet)=>sum+x.level,0)/2)));
    }
    c.ruleState.prepareReminder = true;
  }
  return true;
}
