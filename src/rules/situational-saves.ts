import {active,level,savingThrowBonus,subclass,type Engine,type Sheet} from './model';
import {ownConditionImmunity,landPurity} from './defensive-traits';
import {hasCondition,automaticSaveFailure} from './conditions';
import {incapacityReason} from './concentration';
import {hasFeat} from './passives';
import {canShieldMaster,shieldSaveBonus} from './shield-master';
import {sheetRollDetails} from './roll-context';
import type {RollMode} from './dice-roll';

export const SAVE_ABILITIES=[['str','Força'],['dex','Destreza'],['con','Constituição'],['int','Inteligência'],['wis','Sabedoria'],['cha','Carisma']] as const;
export const SAVE_EFFECTS=[['other','Outro efeito'],['poison','Veneno'],['charm','Ficar enfeitiçado'],['fear','Ficar amedrontado'],['sleep','Sono mágico']] as const;
export interface SaveSituation {ability:string;effect:'other'|'poison'|'charm'|'fear'|'sleep';magic:'none'|'spell'|'other';creature:'other'|'fey'|'elemental';visible:boolean;onlyTarget:boolean;casterNear:boolean}
const elves=['altoElfo','elfoFloresta','drow','meioElfo'],gnomes=['gnomoFloresta','gnomoRochas'],halflings=['halflingLeve','halflingRobusto'];
export function situationalSaveSources(c:Sheet,E:Engine) {
  const out:string[]=[],race=c.rules?.raceId;
  if(elves.includes(race))out.push('Ancestral Feérico');
  if(gnomes.includes(race))out.push('Esperteza Gnômica');
  if(halflings.includes(race))out.push('Bravura');
  if(['anaoColina','anaoMontanha'].includes(race))out.push('Resiliência Anã');
  if(race==='halflingRobusto')out.push('Resiliência dos Robustos');
  if(level(c,'barbaro')>=2)out.push('Sentido de Perigo');
  if(landPurity(c))out.push('Proteção Natural');
  if(level(c,'monge')>=10)out.push('Pureza Corporal');
  if(level(c,'mago')>=14 && subclass(c,'mago',E)==='abjuracao')out.push('Resistência à Magia');
  if(hasFeat(c,E,'Mestre de Escudo'))out.push('Mestre de Escudo');
  if(hasFeat(c,E,'Matador de Conjuradores'))out.push('Matador de Conjuradores');
  for(const id of ['amedrontado','enfeiticado'])out.push(...ownConditionImmunity(c,id));
  return [...new Set(out)];
}
/** O jogador declara a fonte deste teste, sem transformar circunstâncias
 * passageiras em bônus permanentes. Sono mágico é distinto de sono natural;
 * o veneno declarado é a ameaça resistida, não um efeito composto inteiro. */
export function situationalSaveDetails(c:Sheet,s:SaveSituation,mode:RollMode,E:Engine,extra=0) {
  if(!s || !SAVE_ABILITIES.some(x=>x[0]===s.ability) || !SAVE_EFFECTS.some(x=>x[0]===s.effect) || !['none','spell','other'].includes(s.magic) || !['other','fey','elemental'].includes(s.creature) || [s.visible,s.onlyTarget,s.casterNear].some(x=>typeof x!=='boolean') || !['normal','adv','dis'].includes(mode) || !Number.isSafeInteger(extra) || Math.abs(extra)>100)throw new Error('Confira a habilidade, a fonte e o ajuste desta resistência.');
  if(active(c,'druida:wildShape'))throw new Error('Resistências e características disponíveis na Forma Selvagem continuam na mesa.');
  if(incapacityReason(c)==='Morto')throw new Error('Personagem morto não realiza esta resistência.');
  if(s.effect==='sleep' && s.magic==='none')throw new Error('Sono mágico exige uma magia ou outro efeito mágico. Sono natural não é impedido por Ancestral Feérico.');
  const advantage:string[]=[],immunity:string[]=[],race=c.rules?.raceId;
  const condition={poison:'envenenado',charm:'enfeiticado',fear:'amedrontado'}[s.effect as 'poison'|'charm'|'fear'];
  if(condition)immunity.push(...ownConditionImmunity(c,condition));
  if(landPurity(c) && ['charm','fear'].includes(s.effect) && ['fey','elemental'].includes(s.creature))immunity.push('Proteção Natural · '+(s.creature==='fey'?'fada':'elemental'));
  if(elves.includes(race)) {
    if(s.effect==='charm')advantage.push('Ancestral Feérico');
    if(s.effect==='sleep')immunity.push('Ancestral Feérico · sono mágico');
  }
  if(gnomes.includes(race) && ['int','wis','cha'].includes(s.ability) && s.magic!=='none')advantage.push('Esperteza Gnômica');
  if(halflings.includes(race) && s.effect==='fear')advantage.push('Bravura');
  if(s.effect==='poison') {
    if(['anaoColina','anaoMontanha'].includes(race))advantage.push('Resiliência Anã');
    if(race==='halflingRobusto')advantage.push('Resiliência dos Robustos');
  }
  if(s.ability==='dex' && s.visible && level(c,'barbaro')>=2 && !incapacityReason(c) && !hasCondition(c,'cego') && !hasCondition(c,'surdo'))advantage.push('Sentido de Perigo');
  if(s.magic==='spell' && level(c,'mago')>=14 && subclass(c,'mago',E)==='abjuracao')advantage.push('Resistência à Magia');
  if(s.magic==='spell' && s.casterNear && hasFeat(c,E,'Matador de Conjuradores'))advantage.push('Matador de Conjuradores');
  const shield=s.ability==='dex' && s.onlyTarget && canShieldMaster(c,E)?shieldSaveBonus(c,E):0;
  const d=sheetRollDetails(c,{type:'save',ability:s.ability},mode,E,true,advantage),base=savingThrowBonus(c,s.ability);
  if(!Number.isSafeInteger(base))throw new Error('Bônus da resistência inválido preservado; confira a ficha.');
  return {...d,immunity:[...new Set(immunity)],base,shield,extra,bonus:base+shield+extra,automaticFailure:automaticSaveFailure(c,s.ability)};
}
