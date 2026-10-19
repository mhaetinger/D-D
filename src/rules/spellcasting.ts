import { ability, active, level, subclass, type Engine, type Sheet } from './model';
export function preparation(c: Sheet, classId: string, E: Engine) {
  const n = level(c,classId), type = E.data.classes[classId]?.casting;
  const prepares = ['book','prepared','halfPrepared'].includes(type) && (classId!=='paladino' || n>=2);
  const key = classId==='mago'?'int':classId==='paladino'?'cha':'wis';
  const limit = prepares ? Math.max(1,(classId==='paladino'?Math.floor(n/2):n)+ability(c,key)) : 0;
  const spells = c.spells.filter((s:Sheet)=>s.classId===classId && s.circle>0);
  const always = (s:Sheet) => s.alwaysPrepared || s.automatic && s.extraSource==='Magia de subclasse' || s.extraSource==='Assinatura Mágica';
  return {prepares,limit,used:spells.filter((s:Sheet)=>!always(s) && s.prepared===true).length,always};
}
export function canCastNormally(c: Sheet, spell: Sheet, E: Engine) {
  if (active(c,'barbaro:rage')) return false;
  if (active(c,'druida:wildShape') && (level(c,'druida')<18 || spell.classId!=='druida')) return false;
  if (spell.ritual) return false; // Importação antiga: ritual exclusivo tem ação própria.
  if (spell.circle===0 || spell.atWill || spell.limitedUse) return true;
  const p = preparation(c,spell.classId,E);
  return !p.prepares || p.always(spell) || spell.prepared===true;
}
export function canRitual(c: Sheet, spell: Sheet, E: Engine) {
  if (active(c,'barbaro:rage')) return false;
  if (active(c,'druida:wildShape') && (level(c,'druida')<18 || spell.classId!=='druida')) return false;
  const entry = E.spell(spell.bookId || spell.name);
  if (!spell.ritual && !spell.ritualAvailable && !entry?.ritual) return false;
  if (spell.limitedUse || spell.atWill) return false;
  if (spell.extraSource && spell.ritual) return true; // Talento/Pacto do Tomo registrado.
  if (spell.classId==='mago' && level(c,'mago')) return true;
  if (spell.classId==='bardo' && level(c,'bardo')) return true;
  if (['clerigo','druida'].includes(spell.classId) && level(c,spell.classId)) return canCastNormally(c,{...spell,ritual:false},E);
  return false;
}
export function slotTable(c: Sheet, E: Engine) {
  const casters = c.classes.filter((x:Sheet)=>['bardo','clerigo','druida','mago','feiticeiro'].includes(x.classId) || ['paladino','patrulheiro'].includes(x.classId) && x.level>=2 || x.classId==='guerreiro' && subclass(c,'guerreiro',E)==='cavaleiroArcano' && x.level>=3 || x.classId==='ladino' && subclass(c,'ladino',E)==='trapaceiroArcano' && x.level>=3);
  if (casters.length<2) return c.standardSlots; // Tabelas de classe únicas ficam no motor existente.
  const total = casters.reduce((sum:number,x:Sheet)=>sum+(['paladino','patrulheiro'].includes(x.classId)?Math.floor(x.level/2):['guerreiro','ladino'].includes(x.classId)?Math.floor(x.level/3):x.level),0);
  const row = E.progression.fullSlots[total] || [];
  return Object.fromEntries(row.map((count:number,i:number)=>[i+1,{total:count,used:Math.min(count,c.standardSlots[i+1]?.used || 0)}]).filter(([,v]:any)=>v.total>0));
}
