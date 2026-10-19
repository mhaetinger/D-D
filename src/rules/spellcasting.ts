import { ability, active, level, norm, selections, subclass, type Engine, type Sheet } from './model';
export function armorProficiencies(c:Sheet,E:Engine):string[] {
  if (Array.isArray(c.armorProficiencies)) return c.armorProficiencies;
  const list:string[]=c.classes.flatMap((cls:Sheet,i:number)=>i===0?E.data.classes[cls.classId]?.armor || []:E.multiclass[cls.classId]?.armor || []);
  const race=E.options.races[c.rules?.raceId] || Object.values(E.options.races).find((r:any)=>norm(r.name)===norm(c.race)) as Sheet|undefined;
  list.push(...(race?.armor || []));
  if (['vida','natureza','guerra','tempestade'].includes(subclass(c,'clerigo',E))) list.push('pesada');
  if (level(c,'bardo')>=3 && subclass(c,'bardo',E)==='bravura') list.push('media','escudo');
  const feats=selections(c,E,'feat').concat(selections(c,E,'racialFeat'));
  if(feats.includes('Proteção Leve'))list.push('leve');
  if(feats.includes('Proteção Moderada'))list.push('media','escudo');
  if(feats.includes('Proteção Pesada'))list.push('pesada');
  return [...new Set(list)];
}
export function wizardPrivilege(c:Sheet,s:Sheet,E:Engine) {
  if (s.classId!=='mago' || s.extraSource) return null;
  const entry=E.spell(s.bookId || s.name),id=entry?.id,circle=entry?.level;
  if (!entry) return null;
  if (level(c,'mago')>=20 && circle===3 && selections(c,E,'signature').includes(id)) return {value:'signature',level:circle,total:1,remaining:Math.max(0,1-(c.ruleState?.used?.['mago:signature:'+id] || 0)),source:'Assinatura · sem espaço',id};
  if (level(c,'mago')>=18 && [1,2].includes(circle) && selections(c,E,'mastery'+circle).includes(id)) return {value:'mastery',level:circle,total:Infinity,remaining:Infinity,source:'Dominar Magia · sem espaço',id};
  return null;
}
/** O bloqueio vem do equipamento usado, não da presença de uma armadura na mochila. */
export function castingRestriction(c:Sheet,E:Engine,spell?:Sheet) {
  if (active(c,'barbaro:rage')) return 'Não pode conjurar durante a Fúria.';
  if (active(c,'druida:wildShape') && (level(c,'druida')<18 || spell && spell.classId!=='druida')) return 'Não pode conjurar nesta Forma Selvagem.';
  const profs=armorProficiencies(c,E);
  const armor=E.armorInfo(c.armorEquipped);
  if (armor && armor.type!=='shield' && !profs.includes(armor.type)) return 'Armadura vestida sem proficiência impede conjurar.';
  if (c.shieldEquipped && !profs.includes('escudo')) return 'Escudo sem proficiência impede conjurar.';
  return null;
}
export function preparation(c: Sheet, classId: string, E: Engine) {
  const n = level(c,classId), type = E.data.classes[classId]?.casting;
  const prepares = ['book','prepared','halfPrepared'].includes(type) && (classId!=='paladino' || n>=2);
  const key = classId==='mago'?'int':classId==='paladino'?'cha':'wis';
  const limit = prepares ? Math.max(1,(classId==='paladino'?Math.floor(n/2):n)+ability(c,key)) : 0;
  const spells = c.spells.filter((s:Sheet)=>s.classId===classId && s.circle>0);
  const always = (s:Sheet) => s.alwaysPrepared || s.automatic && s.extraSource==='Magia de subclasse' || s.extraSource==='Assinatura Mágica' || wizardPrivilege(c,s,E)?.value==='signature';
  return {prepares,limit,used:spells.filter((s:Sheet)=>!always(s) && s.prepared===true).length,always};
}
export function canCastNormally(c: Sheet, spell: Sheet, E: Engine) {
  if (castingRestriction(c,E,spell)) return false;
  if (spell.ritual) return false; // Importação antiga: ritual exclusivo tem ação própria.
  if (spell.circle===0 || spell.atWill || spell.limitedUse) return true;
  const p = preparation(c,spell.classId,E);
  return !p.prepares || p.always(spell) || spell.prepared===true;
}
export function canRitual(c: Sheet, spell: Sheet, E: Engine) {
  if (castingRestriction(c,E,spell)) return false;
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
