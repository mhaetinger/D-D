import { weaponStats } from './combat';
import { active, level, norm, subclass, type Engine, type Sheet } from './model';
import { incapacityReason } from './concentration';
import { parseDiceFormula } from './dice-formula';
import {weaponPowerAttack} from './weapon-power-attack';
import {damageManeuvers,damageManeuverResolution,maneuverTraining,type DamageManeuver} from './maneuvers';
import {spend} from './resources';
import {superiorityOptions} from './superiority';

export interface WeaponDamageChoice {
  critical?:boolean;
  powerAttack?:boolean;
  sneak?:'advantage'|'ally';
  colossus?:boolean;
  smiteSlot?:string;
  smiteFavored?:boolean;
  maneuver?:DamageManeuver;
  superiority?:string;
  maneuverAbility?:'str'|'dex';
  noOtherManeuver?:boolean;
}
export interface SmiteSlot {value:string;level:number;remaining:number;label:string}
const validPool=(p:Sheet)=>p && Number.isSafeInteger(p.total) && p.total>0 && p.total<=100 && Number.isSafeInteger(p.used) && p.used>=0 && p.used<=p.total;
/** São exatamente as reservas da ficha, sem conceder espaços por uma prévia
 * de multiclasse, usar usos raciais ou disparar efeitos de conjuração. */
export function smiteSlots(c:Sheet):SmiteSlot[] {
  const slots=Object.entries(c.standardSlots || {}).filter(([n,p]:[string,any])=>/^[1-9]$/.test(n) && validPool(p)).map(([n,p]:[string,any])=>({value:'slot:'+n,level:Number(n),remaining:p.total-p.used,label:`Conjuração · ${n}º · ${p.total-p.used}/${p.total}`}));
  if(level(c,'bruxo') && validPool(c.pactMagic) && Number.isInteger(c.pactMagic.level) && c.pactMagic.level>=1 && c.pactMagic.level<=5)slots.push({value:'pact',level:c.pactMagic.level,remaining:c.pactMagic.total-c.pactMagic.used,label:`Pacto · ${c.pactMagic.level}º · ${c.pactMagic.total-c.pactMagic.used}/${c.pactMagic.total}`});
  return slots.sort((a,b)=>a.level-b.level);
}
export function weaponDamageOptions(c:Sheet,entry:Sheet,E:Engine) {
  const w=weaponStats(c,entry,E),automatic=!!w.ruleWeapon && w.calculationMode!=='manual',hasDamage=w.weaponDie && w.weaponDie!=='0';
  const sneak=automatic && hasDamage && level(c,'ladino')>0 && (w.rangedWeapon || /acuidade/i.test(w.properties));
  const colossus=automatic && hasDamage && level(c,'patrulheiro')>=3 && subclass(c,'patrulheiro',E)==='cacador' && c.rules?.history?.some((h:Sheet)=>h.classId==='patrulheiro' && h.level===3 && [h.answers?.hunter].flat().includes('Assassino de Colossos'));
  const training=maneuverTraining(c,E);
  const maneuvers=automatic && hasDamage?Object.entries(damageManeuvers).filter(([,m])=>training.known.has(norm(m.name))).map(([id,m])=>({id:id as DamageManeuver,...m})):[];
  const superiority=maneuvers.length?superiorityOptions(c,E):[];
  return {w,automatic,sneak:!!sneak,colossus:!!colossus,smite:automatic && !!hasDamage && w.meleeAttack && level(c,'paladino')>=2,maneuvers,superiority};
}
function criticalFormula(formula:string,critical:boolean) {
  const parsed=parseDiceFormula(formula);if(!parsed)throw new Error('Fórmula de dano inválida. Corrija o ataque; nenhum recurso foi gasto.');
  const terms=Object.entries(parsed.counts).map(([sides,n])=>`${n*(critical?2:1)}d${sides}`);
  let result=terms.join('+');
  if(!result && parsed.modifier<0)result='0'; // Conserva a gramática anterior: 0-3, nunca -3 inicial.
  if(parsed.modifier || !result)result+=(result && parsed.modifier>=0?'+':'')+parsed.modifier;
  if(!parseDiceFormula(result))throw new Error('A composição ultrapassa o limite do rolador (100 dados). Nenhum recurso foi gasto.');
  return result;
}
/** Um acerto já confirmado pela mesa. Crítico dobra dados do ataque, incluindo
 * Furtivo/Destruição, mas não o modificador nem os dados extras do próprio
 * crítico. Não tenta deduzir alvo, turno ou vantagem pelo último d20 da bandeja. */
export function previewWeaponDamage(c:Sheet,entry:Sheet,choice:WeaponDamageChoice,E:Engine) {
  if(incapacityReason(c))throw new Error('É preciso poder atacar para registrar este dano de arma.');
  if(active(c,'druida:wildShape'))throw new Error('Resolva os ataques e as estatísticas da Forma Selvagem na mesa.');
  if(!entry || !c.weapons?.includes(entry))throw new Error('O ataque não pertence mais a esta ficha.');
  if(!choice || ['critical','powerAttack','colossus','smiteFavored'].some(k=>choice[k as keyof WeaponDamageChoice]!==undefined && typeof choice[k as keyof WeaponDamageChoice]!=='boolean') || choice.sneak!==undefined && !['advantage','ally'].includes(choice.sneak) || choice.smiteSlot!==undefined && typeof choice.smiteSlot!=='string')throw new Error('Confira as escolhas de dano deste acerto.');
  const options=weaponDamageOptions(c,entry,E),{w,automatic}=options,critical=!!choice.critical;
  const powerAttack=weaponPowerAttack(c,entry,choice.powerAttack ?? false,E);
  if(automatic && w.weaponDie==='0')throw new Error('Esta arma tem efeito especial, sem dano de arma rolável. Consulte sua descrição.');
  if(choice.sneak && !options.sneak || choice.colossus && !options.colossus || choice.smiteSlot && !options.smite)throw new Error('Esta arma, classe ou nível não permite o dano adicional escolhido.');
  if(choice.smiteFavored && !choice.smiteSlot)throw new Error('Escolha um espaço para a Destruição Divina antes de indicar o alvo.');
  const slot=choice.smiteSlot?smiteSlots(c).find(s=>s.value===choice.smiteSlot && s.remaining>0):undefined;
  if(choice.smiteSlot && !slot)throw new Error('O espaço escolhido está indisponível; nenhum recurso foi gasto.');
  let maneuver=null;
  if(choice.maneuver!==undefined){
    const selected=options.maneuvers.find(m=>m.id===choice.maneuver),source=options.superiority.find(s=>s.id===choice.superiority);
    if(!selected || !source)throw new Error('Escolha uma manobra conhecida e uma origem de superioridade desta ficha.');
    if(!source.readable)throw new Error('Registro de superioridade ilegível preservado. Confira os usos antes de continuar.');
    if(source.remaining<1)throw new Error('A origem de superioridade está esgotada; nenhum recurso foi gasto.');
    if(choice.noOtherManeuver!==true)throw new Error('Confirme que nenhuma outra manobra foi usada neste ataque, inclusive Precisão.');
    maneuver={...selected,source,...damageManeuverResolution(c,selected,choice.maneuverAbility)};
  }else if(choice.superiority!==undefined || choice.maneuverAbility!==undefined || choice.noOtherManeuver!==undefined)throw new Error('Escolha a manobra antes de indicar seu dado e sua CD.');
  const parts:{name:string;formula:string;type:string}[]=[];
  const add=(name:string,formula:string,type:string,alreadyCritical=false)=>parts.push({name,formula:criticalFormula(formula,critical && !alreadyCritical),type});
  if(!automatic)add('Dano personalizado',w.damage,w.dmgTypeLabel || 'tipo da mesa');
  else {
    const modifier=Number(w.damageBonus);
    add('Arma',`${w.weaponDie}${modifier<0?'':'+'}${modifier}`,w.dmgTypeLabel);
    if(w.improvedSmite)add('Destruição Divina Aprimorada','1d8','radiante');
    if(w.lifedrinker)add('Sorvedor de Vida',String(w.lifedrinker),'necrótico');
  }
  if(choice.sneak)add('Ataque Furtivo',`${Math.ceil(level(c,'ladino')/2)}d6`,w.dmgTypeLabel);
  if(choice.colossus)add('Assassino de Colossos','1d8',w.dmgTypeLabel);
  if(slot)add('Destruição Divina',`${Math.min(5,slot.level+1)+(choice.smiteFavored?1:0)}d8`,'radiante');
  if(powerAttack)add(powerAttack.name,String(powerAttack.damage),powerAttack.type);
  if(maneuver)add(maneuver.name,`1d${maneuver.source.die}`,w.dmgTypeLabel);
  if(automatic && critical && w.meleeAttack && w.weaponDie!=='0') {
    const weaponDie=String(w.weaponDie).match(/^\d+d(\d+)$/)?.[1];
    if(weaponDie) {
      const barbarian=level(c,'barbaro'),extra=barbarian>=17?3:barbarian>=13?2:barbarian>=9?1:0;
      if(extra)add('Crítico Brutal',`${extra}d${weaponDie}`,w.dmgTypeLabel,true);
      if(c.rules?.raceId==='meioOrc')add('Ataques Selvagens',`1d${weaponDie}`,w.dmgTypeLabel,true);
    }
  }
  const parsed=parseDiceFormula(parts.map(p=>p.formula).join('+').replace(/\+-/g,'-'));
  if(!parsed)throw new Error('A composição ultrapassa os limites do rolador; nenhum recurso foi gasto.');
  return {name:String(w.name),critical,powerAttack,manual:!automatic,formula:parsed.formula,parts,slot:slot || null,maneuver,
    summary:parts.map(p=>`${p.name}: ${p.formula} ${p.type}`).join(' · ')};
}
/** Valida todos os custos antes de descontar. Destruição não é conjuração de magia:
 * não cria proteção, troca concentração nem recebe bônus de uma magia lançada. */
export function commitWeaponDamage(c:Sheet,entry:Sheet,choice:WeaponDamageChoice,E:Engine) {
  const plan=previewWeaponDamage(c,entry,choice,E);
  if(plan.maneuver)spend(c,plan.maneuver.source.resource);
  if(plan.slot?.value==='pact')c.pactMagic.used+=1;
  else if(plan.slot)c.standardSlots[plan.slot.level].used+=1;
  return plan;
}
export type WeaponDamagePlan=ReturnType<typeof previewWeaponDamage>;
