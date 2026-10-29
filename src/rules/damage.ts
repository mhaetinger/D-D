import { active, level, norm, selections, subclass, type Engine, type Sheet } from './model';
import { incapacityReason } from './concentration';
import { automaticSaveFailure, hasCondition } from './conditions';
import {dragonAncestry} from './draconic-ancestry';
import {previewParry,type ParryChoice} from './parry';
import {previewMonkDefense,type MonkDefenseChoice} from './monk';

export const DAMAGE_TYPES = [
  ['acid','Ácido'],['bludgeoning','Concussão'],['slashing','Cortante'],['lightning','Elétrico'],
  ['force','Energia'],['fire','Fogo'],['cold','Frio'],['necrotic','Necrótico'],['piercing','Perfurante'],
  ['psychic','Psíquico'],['radiant','Radiante'],['thunder','Trovejante'],['poison','Veneno'],
] as const;
export type DamageType=typeof DAMAGE_TYPES[number][0];
export const DAMAGE_SOURCES = [
  ['weapon','Ataque de arma · não mágico'],['magicWeapon','Ataque de arma · mágico'],
  ['spellAttack','Magia · ataque'],['spell','Magia · outro efeito'],
  ['attack','Outro ataque · não mágico'],['magicAttack','Outro ataque · mágico'],
  ['other','Outro dano · não mágico'],['magic','Outro dano · mágico'],
] as const;
export type DamageSource=typeof DAMAGE_SOURCES[number][0];
export type DamageDefense='auto'|'normal'|'resistance'|'immunity';
export interface DamagePart { type:DamageType; amount:number; defense?:DamageDefense; vulnerable?:boolean; reduction?:number }
export interface DamagePacket { source:DamageSource; parts:DamagePart[]; critical?:boolean; silvered?:boolean; uncannyDodge?:boolean; dexteritySave?:'success'|'failure'; modifierOrder?:'reduceFirst'|'halveFirst'; parry?:ParryChoice; parryOrder?:'armorFirst'|'parryFirst';monkDefense?:MonkDefenseChoice;monkOrder?:'armorFirst'|'monkFirst' }
export const damageTypeName=(type:string)=>DAMAGE_TYPES.find(x=>x[0]===type)?.[1] || '';
const typeFromText=(text:unknown)=>DAMAGE_TYPES.find(([id,name])=>norm(text)===id || norm(text)===norm(name))?.[0];
const lastChoice=(c:Sheet,E:Engine,cls:string|null,key:string)=>E.selections(c,cls,key)?.at(-1);
const dragonType=(choice:unknown)=>dragonAncestry(choice)?.type;
export const fiendResistanceType=(c:Sheet,E:Engine)=>level(c,'bruxo')>=10 && subclass(c,'bruxo',E)==='corruptor'?typeFromText(lastChoice(c,E,'bruxo','fiendResistance')):undefined;
export const isDamageAttack=(source:string)=>['weapon','magicWeapon','spellAttack','attack','magicAttack'].includes(source);
function hunterDefense(c:Sheet,E:Engine,name:string) {
  return level(c,'patrulheiro')>=15 && subclass(c,'patrulheiro',E)==='cacador' && c.rules?.history?.some((h:Sheet)=>h.classId==='patrulheiro' && h.level===15 && [h.answers?.hunter].flat().includes(name));
}
export const hasEvasion=(c:Sheet,E:Engine)=>level(c,'ladino')>=7 || level(c,'monge')>=7 || hunterDefense(c,E,'Evasão');
export const hasUncannyDodge=(c:Sheet,E:Engine)=>level(c,'ladino')>=5 || hunterDefense(c,E,'Esquiva Sobrenatural');
export function canUncannyDodge(c:Sheet,E:Engine,source:string) {
  return hasUncannyDodge(c,E) && isDamageAttack(source) && !incapacityReason(c) && !hasCondition(c,'cego');
}
export const heavyArmorReduction=(c:Sheet,E:Engine,source:string)=>['weapon','attack'].includes(source) && E.armorInfo(c.armorEquipped)?.type==='pesada' && selections(c,E,'feat').concat(selections(c,E,'racialFeat')).includes('Maestria em Armadura Pesada')?3:0;

export function arcaneWardPoints(c:Sheet) {
  const abjurer=c.classes?.some((x:Sheet)=>x.classId==='mago' && x.level>=2 && (x.subclassId==='abjuracao' || norm(x.subclass).includes('abjuracao')));
  return abjurer?Number(c.ruleState?.pools?.['mago:ward'] || 0):0;
}
/** Somente fontes verificadas, sem inferir resistências a partir de texto livre.
 * A besta não possui bloco de estatísticas integrado; o chamador impede usá-las
 * na Forma Selvagem. O seletor 2024 não participa destas regras de 2014. */
export function damageDefenses(c:Sheet,type:DamageType,packet:Pick<DamagePacket,'source'|'silvered'>,E:Engine) {
  const resistance:string[]=[],immunity:string[]=[],physical=['bludgeoning','piercing','slashing'].includes(type);
  const weapon=['weapon','magicWeapon'].includes(packet.source),spell=['spell','spellAttack'].includes(packet.source);
  const race=c.rules?.raceId,sub=(id:string)=>subclass(c,id,E);
  if(type==='fire' && race==='tiefling')resistance.push('Resistência Infernal');
  if(type==='poison' && ['anaoColina','anaoMontanha'].includes(race))resistance.push('Resiliência Anã');
  if(race==='draconato' && dragonType(lastChoice(c,E,null,'raceDragon'))===type)resistance.push('Ancestral Dracônico · raça');
  const incapacity=incapacityReason(c),unconscious=incapacity==='Morto' || incapacity?.startsWith('Inconsciente');
  if(level(c,'barbaro') && active(c,'barbaro:rage') && !unconscious) {
    const bear=level(c,'barbaro')>=3 && sub('barbaro')==='totemico' && norm(c.rules?.history?.find((h:Sheet)=>h.classId==='barbaro' && h.level===3)?.answers?.totem)==='urso';
    // O Espírito do Urso tem texto próprio; não herda a restrição das três
    // vantagens básicas de Fúria a quem está sem armadura pesada.
    if(bear && type!=='psychic')resistance.push('Totem Espiritual · Urso');
    else if(physical && E.armorInfo(c.armorEquipped)?.type!=='pesada')resistance.push('Fúria');
  }
  if(active(c,'spell:bladeWard') && physical && weapon)resistance.push('Proteção contra Lâminas');
  if(c.ruleState?.conditions?.petrificado===true) {
    resistance.push('Petrificado');if(type==='poison')immunity.push('Petrificado · veneno');
  }
  if(type==='poison' && level(c,'monge')>=10)immunity.push('Pureza Corporal');
  if(type==='poison' && level(c,'druida')>=10 && sub('druida')==='terra')immunity.push('Proteção Natural');
  if(level(c,'monge')>=18 && active(c,'monge:emptyBody') && type!=='force')resistance.push('Corpo Vazio');
  if(type==='psychic' && level(c,'bruxo')>=10 && sub('bruxo')==='grandeAntigo')resistance.push('Escudo de Pensamentos');
  // Armas mágicas/de prata ignoram esta resistência específica, não as demais.
  if(fiendResistanceType(c,E)===type && !(weapon && (packet.source==='magicWeapon' || packet.silvered)))resistance.push('Resistência Demoníaca');
  if(level(c,'mago')>=14 && sub('mago')==='abjuracao' && spell)resistance.push('Resistência à Magia');
  if(level(c,'mago')>=6 && sub('mago')==='transmutacao' && active(c,'mago:stone') && c.ruleState?.targets?.['mago:stone']===type && ['acid','cold','fire','lightning','thunder'].includes(type))resistance.push('Pedra do Transmutador');
  if(level(c,'feiticeiro')>=6 && sub('feiticeiro')==='draconica' && active(c,'feiticeiro:elementalAffinity') && dragonType(lastChoice(c,E,'feiticeiro','dragon'))===type)resistance.push('Afinidade Elemental');
  return {resistance,immunity};
}

/** Uma ocorrência (ataque, queda, magia etc.) pode conter vários tipos. A ordem
 * declarada resolve a alocação da Proteção Arcana; a mesa escolhe essa ordem.
 * 2014: proteção externa → imunidade → redução → resistência → vulnerabilidade.
 * Resistências repetidas não dividem novamente; arredonda-se antes de dobrar. */
export function previewTypedDamage(c:Sheet,packet:DamagePacket,E:Engine) {
  if(active(c,'druida:wildShape'))throw new Error('Resolva o dano e o excesso da Forma Selvagem na mesa; use o modo já resolvido. As resistências da besta ainda não estão integradas.');
  if(!packet || !DAMAGE_SOURCES.some(x=>x[0]===packet.source) || !Array.isArray(packet.parts) || !packet.parts.length || packet.parts.length>13)throw new Error('Informe a origem e de 1 a 13 tipos de uma única ocorrência de dano.');
  if(packet.critical!==undefined && typeof packet.critical!=='boolean' || packet.silvered!==undefined && typeof packet.silvered!=='boolean')throw new Error('Confira a origem e o crítico do dano.');
  if(packet.uncannyDodge!==undefined && typeof packet.uncannyDodge!=='boolean' || packet.dexteritySave!==undefined && !['success','failure'].includes(packet.dexteritySave) || packet.modifierOrder!==undefined && !['reduceFirst','halveFirst'].includes(packet.modifierOrder))throw new Error('Confira o teste, a reação e a ordem dos modificadores.');
  if(packet.uncannyDodge && !canUncannyDodge(c,E,packet.source))throw new Error('Esquiva Sobrenatural exige a característica, um ataque, visão do atacante e capacidade de usar a reação.');
  if(packet.dexteritySave && isDamageAttack(packet.source))throw new Error('Separe o dano do ataque e o efeito com resistência de DES para metade.');
  if(packet.dexteritySave==='success' && automaticSaveFailure(c,'dex'))throw new Error('A condição atual causa falha automática na resistência de DES.');
  if(packet.parryOrder!==undefined && !['armorFirst','parryFirst'].includes(packet.parryOrder))throw new Error('Confira a ordem de Aparar e da redução de armadura.');
  if(packet.parry && (!isDamageAttack(packet.source) || packet.uncannyDodge))throw new Error('Aparar exige um ataque corpo a corpo e sua reação: não combine com Esquiva Sobrenatural na mesma ocorrência.');
  const parry=packet.parry?previewParry(c,packet.parry,E):null;
  if(packet.monkOrder!==undefined && !['armorFirst','monkFirst'].includes(packet.monkOrder))throw new Error('Confira a ordem da redução do monge e da armadura.');
  const monkDefense=packet.monkDefense?previewMonkDefense(c,packet.monkDefense):null;
  if(monkDefense && (packet.parry || packet.uncannyDodge))throw new Error('Não combine duas reações na mesma ocorrência.');
  if(monkDefense?.kind==='projectile' && !['weapon','magicWeapon'].includes(packet.source))throw new Error('Defletir Projéteis exige ataque de arma à distância; não afeta ataque de magia.');
  if(monkDefense?.kind==='fall' && (packet.source!=='other' || packet.parts.some(p=>p.type!=='bludgeoning') || monkDefense.catch || packet.dexteritySave))throw new Error('Queda Lenta exige dano da própria queda, não mágico, de concussão.');
  if(parry && previewTypedDamage(c,{...packet,parry:undefined},E).received===0)throw new Error('Este dano já é zero após proteção e defesas; Aparar não se aplica.');
  const evasion=!!packet.dexteritySave && hasEvasion(c,E),zero=evasion && packet.dexteritySave==='success';
  const saveHalf=packet.dexteritySave==='success' || evasion && packet.dexteritySave==='failure';
  const heavyAvailable=heavyArmorReduction(c,E,packet.source);
  let heavyRemaining=heavyAvailable;
  let parryRemaining=parry?.reduction || 0;
  let monkRemaining=monkDefense?.reduction || 0;
  let wardRemaining=arcaneWardPoints(c);
  if(!Number.isSafeInteger(wardRemaining) || wardRemaining<0)throw new Error('Reserva de Proteção Arcana inválida preservada; confira a ficha.');
  const seen=new Set<string>();
  const parts=packet.parts.map(part=>{
    if(!part || !DAMAGE_TYPES.some(x=>x[0]===part.type))throw new Error('Escolha um tipo de dano em cada linha.');
    if(seen.has(part.type))throw new Error('Escolha tipos diferentes; some os valores do mesmo tipo antes de informar.');
    seen.add(part.type);
    const reduction=part.reduction ?? 0,defense=part.defense ?? 'auto';
    if(!Number.isSafeInteger(part.amount) || part.amount<1 || part.amount>1_000_000 || !Number.isSafeInteger(reduction) || reduction<0 || reduction>1_000_000 || !['auto','normal','resistance','immunity'].includes(defense) || part.vulnerable!==undefined && typeof part.vulnerable!=='boolean')throw new Error('Informe dano inteiro de 1 a 1.000.000 e redução inteira não negativa, até 1.000.000.');
    // O resultado do teste define o dano do efeito antes de atingir a proteção.
    // As defesas pessoais seguintes não protegem os PV próprios da Proteção Arcana.
    const afterSave=zero?0:saveHalf?Math.floor(part.amount/2):part.amount;
    const ward=Math.min(wardRemaining,afterSave);wardRemaining-=ward;
    const automatic=damageDefenses(c,part.type,packet,E);
    const immunity=defense==='auto'?automatic.immunity:defense==='immunity'?['Imunidade · mesa']:[];
    const resistance=defense==='auto'?automatic.resistance:defense==='resistance'?['Resistência · mesa']:[];
    const afterWard=afterSave-ward;
    // Um ataque misto recebe 3 pontos de redução no total, alocados pela ordem
    // dos tipos físicos. A mesa pode ordenar as linhas antes de confirmar.
    const beforeReduction=packet.uncannyDodge && packet.modifierOrder==='halveFirst'?Math.floor(afterWard/2):afterWard;
    const available=immunity.length?0:Math.max(0,beforeReduction-reduction),parryFirst=packet.parryOrder==='parryFirst';
    const earlyParry=parryFirst?Math.min(parryRemaining,available):0,earlyMonk=packet.monkOrder==='monkFirst'?Math.min(monkRemaining,available-earlyParry):0;
    const heavyReduction=!['bludgeoning','piercing','slashing'].includes(part.type)?0:Math.min(heavyRemaining,available-earlyParry-earlyMonk);heavyRemaining-=heavyReduction;
    const parryReduction=parryFirst?earlyParry:Math.min(parryRemaining,available-heavyReduction);parryRemaining-=parryReduction;
    const monkReduction=packet.monkOrder==='monkFirst'?earlyMonk:Math.min(monkRemaining,available-heavyReduction-parryReduction);monkRemaining-=monkReduction;
    const reduced=Math.max(0,available-heavyReduction-parryReduction-monkReduction);
    const afterReduction=packet.uncannyDodge && packet.modifierOrder!=='halveFirst'?Math.floor(reduced/2):reduced;
    const afterResistance=resistance.length?Math.floor(afterReduction/2):afterReduction;
    return {...part,defense,reduction,heavyReduction,ward,immunity,resistance,afterSave,afterWard,afterReduction,received:afterResistance*(part.vulnerable?2:1),...(parry?{parryReduction}:{}),...(monkDefense?{monkReduction}:{})};
  });
  const catchable=monkDefense?.kind==='projectile' && parts.some(p=>(p.monkReduction || 0)>0) && parts.every(p=>p.afterReduction===0);
  if(monkDefense?.catch && !catchable)throw new Error('Só pode apanhar se Defletir reduzir o dano a zero antes de resistência; confira tamanho e mão livre.');
  return {source:packet.source,critical:!!packet.critical,silvered:!!packet.silvered,uncannyDodge:!!packet.uncannyDodge,dexteritySave:packet.dexteritySave,evasion,modifierOrder:packet.modifierOrder || 'reduceFirst',parts,
    raw:parts.reduce((n,p)=>n+p.amount,0),ward:parts.reduce((n,p)=>n+p.ward,0),received:parts.reduce((n,p)=>n+p.received,0),...(parry?{parry,parryOrder:heavyAvailable?packet.parryOrder || 'armorFirst':undefined}:{}),...(monkDefense?{monkDefense,catchable,monkOrder:packet.monkOrder || 'armorFirst'}:{})};
}
export type DamagePlan=ReturnType<typeof previewTypedDamage>;
export function typedDamageSummary(plan:DamagePlan) {
  const reaction=plan.uncannyDodge?`Esquiva Sobrenatural · usa reação · ${plan.modifierOrder==='halveFirst'?'metade antes das reduções':'reduções antes da metade'}; `:'';
  const save=plan.dexteritySave?`DES para metade · ${plan.dexteritySave==='success'?'sucesso':'falha'}${plan.evasion?' · Evasão':''}; `:'';
  const parry=plan.parry?`Aparar · reação · ${plan.parry.source.name} d${plan.parry.source.die}[${plan.parry.face}] + DES (${plan.parry.dex}) = até ${plan.parry.reduction} de redução · gasta 1 dado${plan.parryOrder?` · ${plan.parryOrder==='parryFirst'?'Aparar antes da armadura':'armadura antes de Aparar'}`:''}; `:'';
  const fixed=(p:DamagePlan['parts'][number])=>{const armor=p.heavyReduction?` − Maestria em Armadura Pesada ${p.heavyReduction}`:'',parry=p.parryReduction?` − Aparar ${p.parryReduction}`:'';return plan.parryOrder==='parryFirst'?parry+armor:armor+parry;};
  const monk=plan.monkDefense?`${plan.monkDefense.name} · reação · até ${plan.monkDefense.reduction} de redução · ${plan.monkOrder==='monkFirst'?'monge antes da armadura':'armadura antes do monge'}${plan.monkDefense.catch?' · projétil apanhado':''}; `:'';
  return reaction+save+parry+monk+plan.parts.map(p=>`${p.amount} ${damageTypeName(p.type)}${plan.dexteritySave?` → teste ${p.afterSave}`:''}${p.ward?` − proteção ${p.ward}`:''}${p.immunity.length?` · ${p.immunity.join(', ')} = 0`:`${p.reduction?` − redução ${p.reduction}`:''}${fixed(p)}${p.monkReduction?` − ${plan.monkDefense!.name} ${p.monkReduction}`:''}${p.resistance.length?` · resistência (${p.resistance.join(', ')}) ÷2`:p.defense==='normal'?' · sem defesa (mesa)':''}${p.vulnerable?' · vulnerabilidade ×2 (mesa)':''} = ${p.received}`}`).join('; ');
}
