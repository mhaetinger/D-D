import {escape} from '../rules/model';

/** Usa o balão compartilhado por hover/foco, sem título nativo ou ação de clique.
 * O controle continua responsável apenas por marcar ou editar seu valor. */
export function helpAttributes(name:string,text:string):string {
  return text?`data-rule-tooltip="${escape(JSON.stringify({name,text}))}"`:'';
}
