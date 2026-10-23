import {racialBreathProfile} from './draconic-ancestry';
import {active,proficiency,state,type Engine,type Sheet} from './model';
import {requireConscious} from './health';
import {remaining,resourcesFor,spend} from './resources';

export const BREATH_ID='race:breath';
export const BREATH_TYPES:Record<string,string>={acid:'Ácido',cold:'Frio',fire:'Fogo',lightning:'Elétrico',poison:'Veneno'};
export type BreathOptions={shapeCon?:number;shapeCapable?:boolean};

/** A área contém todas as criaturas. A ficha não decide alvos, rola suas
 * resistências nem aplica seus PV; mostra dano integral e metade arredondada. */
export function previewDragonbornBreath(c:Sheet,E:Engine,options:BreathOptions={}) {
  requireConscious(c);
  const profile=racialBreathProfile(c,E);
  if(!profile)throw new Error('Escolha uma ancestralidade racial válida para usar o sopro de draconato.');
  if(!profile.dice || !Number.isSafeInteger(profile.dc) || c.abilities.con.score<0 || c.abilities.con.score>30)throw new Error('Confira nível total e Constituição antes de usar o sopro.');
  let dc=profile.dc;
  if(active(c,'druida:wildShape')){
    if(options.shapeCapable!==true)throw new Error('Confirme com a mesa que a forma é fisicamente capaz de usar o sopro.');
    if(options.shapeCon===undefined || !Number.isInteger(options.shapeCon) || options.shapeCon< -5 || options.shapeCon>10)throw new Error('Informe o modificador de Constituição da forma, entre -5 e 10.');
    dc=8+options.shapeCon+proficiency(c);
  }
  const recorded=c.ruleState?.used?.[BREATH_ID];
  if(recorded!==undefined && (!Number.isSafeInteger(recorded) || recorded<0))throw new Error('Registro de uso do sopro ilegível preservado. Confira o registro antes de usar.');
  const resource=resourcesFor(c,E).find(r=>r.id===BREATH_ID);
  if(!resource || remaining(c,resource)<1)throw new Error('Sopro esgotado; conclua um descanso curto ou longo.');
  const count=Number(profile.dice.split('d')[0]);
  return {...profile,dc,count,label:BREATH_TYPES[profile.type]};
}

/** Recebe o total já rolado, inclusive físico. Nenhum RNG ou outro recurso é
 * acionado aqui; entradas inválidas não gastam o uso nem alteram PV/notas. */
export function useDragonbornBreath(c:Sheet,total:number,E:Engine,options:BreathOptions={},source:'physical'|'virtual'='physical') {
  const profile=previewDragonbornBreath(c,E,options);
  if(!Number.isSafeInteger(total) || total<profile.count || total>profile.count*6)throw new Error(`Informe o total de ${profile.dice}, entre ${profile.count} e ${profile.count*6}.`);
  if(source!=='physical' && source!=='virtual')throw new Error('Escolha dados físicos ou virtuais.');
  const result={version:1,choice:profile.choice,type:profile.type,area:profile.area,save:profile.save,dice:profile.dice,dc:profile.dc,total,half:Math.floor(total/2),source};
  spend(c,resourcesFor(c,E).find(r=>r.id===BREATH_ID)!);
  state(c).lastBreath=result;
  return result;
}
