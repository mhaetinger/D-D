import type {Sheet} from './model';
export interface ReturnedProjectile {name:string;die:number;count:number;modifier:number;type:string;critical:boolean}
let returns=new WeakMap<Sheet,{snapshot:string;projectile:ReturnedProjectile}>();
export function currentMonkReturn(c:Sheet) {const p=returns.get(c);if(p?.snapshot===JSON.stringify(c))return p.projectile;returns.delete(c);}
export const holdMonkReturn=(c:Sheet,projectile:ReturnedProjectile)=>{returns.set(c,{snapshot:JSON.stringify(c),projectile});};
export const endMonkReturn=(c:Sheet)=>returns.delete(c);
/** A reação é imediata. Somente o custo entra no histórico; não reconstitui
 * projétil ao recarregar, desfazer, trocar de ficha/conta/modo ou descansar. */
export const clearMonkReturns=()=>{returns=new WeakMap();};
