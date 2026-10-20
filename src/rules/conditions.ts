import { active, state, type Sheet } from './model';
import { incapacityReason } from './concentration';
import { syncIncapacity } from './health';

export const CONDITIONS = [
  {id:'agarrado',name:'Agarrado',text:'Deslocamento 0. Termina se quem agarra ficar incapacitado ou se um efeito separar vocês do alcance. Não impede por si só conjurar ou manter concentração.'},
  {id:'amedrontado',name:'Amedrontado',text:'Enquanto a fonte do medo estiver à vista: desvantagem em ataques e testes de habilidade. Não pode se aproximar voluntariamente dela. Visibilidade da fonte e modo da jogada são informados pela mesa.'},
  {id:'atordoado',name:'Atordoado',text:'Incapacitado, não pode se mover e fala com dificuldade. Falha automaticamente em resistências de FOR/DES; ataques contra você têm vantagem. Encerra concentração.'},
  {id:'caido',name:'Caído',text:'Ataques próprios têm desvantagem. Atacante a até 1,5 m tem vantagem; de mais longe tem desvantagem. Levantar gasta metade do deslocamento; rastejar custa movimento extra. Levantar é decisão explícita, não acontece ao receber cura.'},
  {id:'cego',name:'Cego',text:'Não pode ver: falha em testes que dependem de visão. Ataques próprios têm desvantagem e ataques contra você têm vantagem. Sentidos especiais e exceções precisam ser conferidos na mesa.'},
  {id:'enfeiticado',name:'Enfeitiçado',text:'Não pode atacar quem o enfeitiçou nem mirar essa criatura com efeitos nocivos. Ela tem vantagem em interações sociais com você. A criatura de origem é controlada pela mesa.'},
  {id:'envenenado',name:'Envenenado',text:'Desvantagem em ataques e testes de habilidade; não impõe desvantagem em resistências por si só.'},
  {id:'impedido',name:'Impedido',text:'Deslocamento 0, ataques próprios e resistências de DES com desvantagem; ataques contra você têm vantagem.'},
  {id:'incapacitado',name:'Incapacitado',text:'Não pode realizar ações ou reações. Encerra concentração; não causa falha automática em resistências por si só. Outras condições podem implicá-la, sem precisar marcá-la duas vezes.'},
  {id:'inconsciente',name:'Inconsciente',text:'Incapacitado, não pode se mover/falar e não percebe os arredores. Cai e larga o que segura. Falha em resistências de FOR/DES; ataques contra você têm vantagem e acertos a até 1,5 m são críticos. Encerra concentração e Fúria. Itens largados e atacantes ficam a cargo da mesa.'},
  {id:'invisivel',name:'Invisível',text:'Não pode ser visto sem magia ou sentido especial; ainda pode ser localizado por ruídos ou rastros. Ataques próprios têm vantagem e contra você têm desvantagem, conforme os sentidos e exceções resolvidos na mesa.'},
  {id:'paralisado',name:'Paralisado',text:'Incapacitado, não pode se mover/falar. Falha em resistências de FOR/DES. Ataques contra você têm vantagem; acertos a até 1,5 m são críticos. Encerra concentração.'},
  {id:'petrificado',name:'Petrificado',text:'Corpo e itens não mágicos viram material sólido; peso ×10 e não envelhece. Incapacitado, não pode se mover/falar, não percebe arredores e falha em resistências de FOR/DES. Ataques contra você têm vantagem; resistência a todo dano e imunidade a veneno/doença. Não cura veneno/doença já existentes. Reduções de dano e peso são resolvidos pela mesa.'},
  {id:'surdo',name:'Surdo',text:'Não pode ouvir e falha em testes que dependem de audição. Não impede por si só falar, conjurar ou manter concentração.'},
] as const;
export type ConditionId=typeof CONDITIONS[number]['id'];
const explicit=(c:Sheet,id:string)=>c.ruleState?.conditions?.[id]===true || id==='inconsciente' && c.conscious===false;
export function hasCondition(c:Sheet,id:string):boolean {
  if(explicit(c,id))return true;
  if(id==='inconsciente')return c.hpCurrent<=0 && !active(c,'druida:wildShape');
  if(id==='caido')return hasCondition(c,'inconsciente');
  if(id==='incapacitado')return !!incapacityReason(c);
  return false;
}
export const derivedCondition=(c:Sheet,id:string)=>id==='caido' && hasCondition(c,'inconsciente') || hasCondition(c,id) && !explicit(c,id);
export function setCondition(c:Sheet,id:string,enabled:boolean) {
  if(!CONDITIONS.some(x=>x.id===id))throw new Error('Condição desconhecida.');
  const s=state(c);
  if(s.conditions!=null && (typeof s.conditions!=='object' || Array.isArray(s.conditions)))throw new Error('Registro de condições ilegível preservado; confira o backup.');
  s.conditions ||= {};
  if(enabled)s.conditions[id]=true;else delete s.conditions[id];
  if(id==='inconsciente' && !enabled && c.conscious===false)c.conscious=true;
  const ended=syncIncapacity(c);
  return {ended};
}
export function conditionSpeed(c:Sheet,base:number) {
  return ['agarrado','impedido','atordoado','inconsciente','paralisado','petrificado'].some(id=>hasCondition(c,id))?0:base;
}
export function automaticSaveFailure(c:Sheet,key:string) {
  return ['str','dex'].includes(key) && ['atordoado','inconsciente','paralisado','petrificado'].some(id=>hasCondition(c,id));
}
