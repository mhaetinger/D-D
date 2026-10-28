import {superioritySources} from './maneuvers';
import {remaining,resourcesFor} from './resources';
import type {Engine,Sheet} from './model';

/** Mesmas origens para Precisão e dano: consultar nunca recupera um uso. */
export function superiorityOptions(c:Sheet,E:Engine) {
  const resources=resourcesFor(c,E);
  return superioritySources(c,E).map(source=>{
    const resource=resources.find(r=>r.id===source.id)!,recorded=c.ruleState?.used?.[source.id] ?? 0;
    const readable=Number.isSafeInteger(recorded) && recorded>=0;
    return {...source,resource,remaining:readable?remaining(c,resource):0,readable};
  });
}
