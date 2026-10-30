import {ability,level,norm,proficiency,subclass,type Engine,type Sheet} from './model';

const values=(value:unknown):unknown[]=>Array.isArray(value)?value:value===undefined?[]:[value];
export const damageManeuvers={
  disarm:{name:'Ataque Desarmante',save:'str',effect:'O alvo testa FOR; na falha, o item empunhado escolhido cai aos pés dele.'},
  trip:{name:'Derrubar',save:'str',effect:'Se o alvo for Grande ou menor, testa FOR; na falha, fica caído. Alvos maiores recebem o dano adicional, sem esse teste.'},
  menace:{name:'Ataque Ameaçador',save:'wis',effect:'Na falha, o alvo fica amedrontado por você até o fim do seu próximo turno.'},
  push:{name:'Ataque de Encontrão',save:'str',effect:'Se o alvo for Grande ou menor, testa FOR; na falha, é empurrado até 4,5 m para longe de você. Alvos maiores recebem o dano adicional, sem esse teste.'},
  goad:{name:'Ataque Provocante',save:'wis',effect:'Na falha, o alvo tem desvantagem nas jogadas de ataque contra criaturas diferentes de você até o fim do seu próximo turno.'},
  maneuvering:{name:'Ataque de Manobra',save:null,effect:'Escolha um aliado que possa ver ou ouvir você. Ele pode gastar a própria reação para se mover até metade do deslocamento, sem provocar ataque de oportunidade do alvo atingido. Outras criaturas ainda podem reagir normalmente.'},
  distract:{name:'Golpe Distrativo',save:null,effect:'A próxima jogada de ataque contra o alvo feita por outra criatura tem vantagem, se ocorrer antes do começo do seu próximo turno. Não beneficia um ataque seu nem todos os ataques dos aliados.'},
} as const;
export type DamageManeuver=keyof typeof damageManeuvers;
type DamageManeuverDefinition=(typeof damageManeuvers)[DamageManeuver];

/** A habilidade que forma a CD é FOR/DES do atacante; o atributo testado pelo
 * alvo depende da manobra. Manobra/Distrativo não inventam teste nem CD. */
export function damageManeuverResolution(c:Sheet,maneuver:DamageManeuverDefinition,key?:'str'|'dex') {
  if(maneuver.save && key!=='str' && key!=='dex')throw new Error('Escolha FOR ou DES para a CD da manobra.');
  if(!maneuver.save && key!==undefined)throw new Error('Esta manobra não pede teste de resistência nem habilidade de CD.');
  const dc=maneuver.save?maneuverDC(c,key!):null,ability=maneuver.save?key!:null;
  const test=maneuver.save?`Resistência de ${maneuver.save==='wis'?'SAB':'FOR'} · CD ${dc} (${key==='str'?'FOR':'DES'})`:'Sem teste de resistência';
  return {dc,ability,note:`${test}. ${maneuver.effect} ${maneuver.save?'Teste e efeito':'Efeito'} na mesa.`};
}

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
