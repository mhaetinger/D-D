import {ability,active,proficiency,type Engine,type Sheet} from './model';
import {hasFeat} from './passives';
import {armorClass,catalogueWeapon,isProficient} from './combat';
import {incapacityReason} from './concentration';

function canAct(c:Sheet) {
  if(incapacityReason(c))throw new Error('É preciso poder agir para usar este talento.');
  if(active(c,'druida:wildShape'))throw new Error('O talento em Forma Selvagem continua na mesa; confira as capacidades da forma.');
}
export function duelistWeapons(c:Sheet,E:Engine) {
  return (c.weapons || []).map((entry:Sheet,index:number)=>({entry,index,w:catalogueWeapon(entry,E)})).filter(({entry,w}:{entry:Sheet;w:Sheet})=>w && /acuidade/i.test(w.properties) && isProficient(c,entry,w,E));
}
export function previewDefensiveDuelist(c:Sheet,choice:{weapon:number;total:number;critical:boolean;declared:boolean},E:Engine) {
  canAct(c);
  const dex=Number(c.abilities?.dex?.score);
  if(!hasFeat(c,E,'Duelista Defensivo') || !Number.isInteger(dex) || dex<13 || dex>30)throw new Error('Duelista Defensivo exige o talento vigente e Destreza 13.');
  if(!duelistWeapons(c,E).some((x:{index:number})=>x.index===choice.weapon))throw new Error('Escolha uma arma de acuidade com proficiência; confirme que está empunhando-a.');
  if(choice.declared!==true)throw new Error('Confirme arma empunhada, reação disponível e acerto corpo a corpo de outra criatura.');
  if(!Number.isSafeInteger(choice.total) || Math.abs(choice.total)>1000 || typeof choice.critical!=='boolean')throw new Error('Informe o total inteiro da jogada recebida e se é crítico.');
  const before=armorClass(c,E).total,bonus=proficiency(c);
  if(!Number.isFinite(before) || !Number.isInteger(bonus) || bonus<2 || bonus>6)throw new Error('Confira a CA e o nível antes de usar a reação.');
  if(choice.total<before && !choice.critical)throw new Error('Esse ataque já erraria a CA atual; confira o gatilho antes de usar a reação.');
  const after=before+bonus;
  return {before,after,bonus,miss:!choice.critical && choice.total<after,critical:choice.critical,total:choice.total};
}
export interface LeaderChoice {allies:string[];self:'none'|'keep'|'replace';declared:boolean}
/** A restrição pertence a cada destinatário, inclusive entre líderes distintos.
 * Sem identidade/descanso de outras fichas, ela é declarada pela mesa; não se
 * inventa uma reserva diária para quem faz o discurso. */
export function previewInspiringLeader(c:Sheet,choice:LeaderChoice,E:Engine) {
  canAct(c);
  const score=Number(c.abilities?.cha?.score),totalLevel=c.classes?.reduce((n:number,x:Sheet)=>n+Number(x.level),0);
  if(!hasFeat(c,E,'Líder Inspirador') || !Number.isInteger(score) || score<13 || score>30)throw new Error('Líder Inspirador exige o talento vigente e Carisma 13.');
  if(!Number.isInteger(totalLevel) || totalLevel<1 || totalLevel>20)throw new Error('Confira o nível total.');
  if(!choice || !['none','keep','replace'].includes(choice.self) || !Array.isArray(choice.allies) || choice.allies.some(x=>typeof x!=='string' || !x.trim() || x.trim().length>80))throw new Error('Identifique os participantes em até 80 caracteres cada.');
  const allies=choice.allies.map(x=>x.trim()),count=allies.length+(choice.self==='none'?0:1);
  if(count<1 || count>6 || new Set(allies.map(x=>x.normalize('NFC').toLocaleLowerCase('pt-BR'))).size!==allies.length)throw new Error('Escolha de uma a seis criaturas, contando você, sem identificações repetidas.');
  if(choice.declared!==true)throw new Error('Confirme 10 minutos de discurso, criaturas amigáveis até 9 m que veem ou ouvem e compreendem você, e descanso de cada uma desde o último benefício deste talento.');
  return {allies,count,self:choice.self,totalLevel,cha:ability(c,'cha'),temporary:totalLevel+ability(c,'cha')};
}
export function applyInspiringLeader(c:Sheet,choice:LeaderChoice,E:Engine) {
  const plan=previewInspiringLeader(c,choice,E);
  if(plan.self==='replace'){c.hpTemp=plan.temporary;c.hpTempSource='Líder Inspirador';}
  return plan;
}
