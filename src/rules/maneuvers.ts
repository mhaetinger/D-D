import {ability,level,norm,proficiency,subclass,type Engine,type Sheet} from './model';

const values=(value:unknown):unknown[]=>Array.isArray(value)?value:value===undefined?[]:[value];
export const damageManeuvers={disarm:{name:'Ataque Desarmante',effect:'O alvo testa FOR; na falha, o item empunhado escolhido cai aos pés dele.'},trip:{name:'Derrubar',effect:'Se o alvo for Grande ou menor, testa FOR; na falha, fica caído. Alvos maiores recebem o dano adicional, sem esse teste.'}} as const;
export type DamageManeuver=keyof typeof damageManeuvers;

/** Escolhas antigas continuam salvas, mas só a aquisição vigente concede uso.
 * A troca de uma manobra da classe não remove uma manobra aprendida pelo talento. */
export function maneuverTraining(c:Sheet,E:Engine) {
  const fighter=level(c,'guerreiro'),battleMaster=fighter>=3 && subclass(c,'guerreiro',E)==='mestreBatalha';
  const history=(c.rules?.history || []).filter((h:Sheet)=>Number.isInteger(h.level) && h.level>=1 && h.level<=level(c,h.classId));
  const known=new Set<string>();
  if(battleMaster)for(const name of E.selections({...c,rules:{...c.rules,history}},'guerreiro','maneuvers'))known.add(norm(name));
  let adept=false;
  for(const event of c.rules?.history || [])for(const key of ['feat','racialFeat']){
    if(key==='feat' && !history.includes(event))continue;
    if(key==='racialFeat' && !E.options.races[c.rules?.raceId]?.feat)continue;
    if(!values(event.answers?.[key]).some(v=>norm(v)==='adepto marcial'))continue;
    adept=true;
    for(const name of values(event.answers?.[key+'Maneuvers']))known.add(norm(name));
  }
  return {fighter,battleMaster,adept,known};
}
/** PHB 2014, p. 87–88; Adepto Marcial com errata oficial (d6 adicional).
 * Superioridade Aprimorada (10/18) melhora todos os seus dados. As duas origens
 * usam contadores distintos para conservar os gastos antigos e distinguir d6/d8.
 * Ambas pagam qualquer manobra conhecida; não são usos extras da mesma reserva. */
export function superioritySources(c:Sheet,E:Engine) {
  const {fighter,battleMaster,adept}=maneuverTraining(c,E);
  const improved=battleMaster && fighter>=10?(fighter>=18?12:10):null;
  const sources:{id:string;classId:string;name:string;max:number;die:number}[]=[];
  if(battleMaster)sources.push({id:'guerreiro:superiority',classId:'guerreiro',name:'Mestre de Batalha',max:fighter>=15?6:fighter>=7?5:4,die:improved || 8});
  if(adept)sources.push({id:'feat:superiority',classId:'feat',name:'Adepto Marcial',max:1,die:improved || 6});
  return sources;
}
export function maneuverDC(c:Sheet,key:'str'|'dex') {
  const dc=8+proficiency(c)+ability(c,key);
  if(!Number.isSafeInteger(dc))throw new Error('Confira a habilidade e os níveis antes de usar a manobra.');
  return dc;
}
