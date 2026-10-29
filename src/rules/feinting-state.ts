import type {Sheet} from './model';

export interface PaidFeint {source:string;name:string;die:number;target:string}
let feints=new WeakMap<Sheet,PaidFeint>();
/** O turno e a identidade do alvo são declarados na mesa. Só o gasto é salvo;
 * recarga/desfazer não podem ressuscitar uma vantagem de outro turno. */
export const pendingFeint=(c:Sheet)=>feints.get(c);
export const holdFeint=(c:Sheet,feint:PaidFeint)=>{feints.set(c,feint);return feint;};
export const clearPendingFeint=(c:Sheet)=>feints.delete(c);
export const clearFeints=()=>{feints=new WeakMap();};
