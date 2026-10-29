import type {Sheet} from './model';

export interface PaidLungingAttack {source:string;name:string;die:number}
export interface WeaponAttackSession {c:Sheet;entry:Sheet;precisionUsed:boolean;lunging?:PaidLungingAttack}
let attacks=new WeakMap<Sheet,WeaponAttackSession>();
let lungingAttacks=new WeakMap<Sheet,WeaponAttackSession>();
/** Identifica só o ataque automático acompanhado nesta sessão. Não inventa
 * turnos nem salva faces no documento; outra jogada desta arma inicia outro ataque. */
export function beginWeaponAttack(c:Sheet,entry:Sheet,lunging?:PaidLungingAttack):WeaponAttackSession {
  finishLungingAttack(c);
  const attack={c,entry,precisionUsed:false,...(lunging?{lunging}: {})};attacks.set(entry,attack);
  if(lunging)lungingAttacks.set(c,attack);
  return attack;
}
export function currentWeaponAttack(c:Sheet,entry:Sheet):WeaponAttackSession|undefined {
  if(!entry)return;
  const attack=attacks.get(entry);
  return attack?.c===c && c.weapons?.includes(entry)?attack:undefined;
}
export const isCurrentWeaponAttack=(attack:WeaponAttackSession)=>currentWeaponAttack(attack.c,attack.entry)===attack;
export const attackHasManeuver=(attack:WeaponAttackSession|undefined)=>!!(attack?.precisionUsed || attack?.lunging);
export function markAttackPrecision(attack:WeaponAttackSession) {
  if(!isCurrentWeaponAttack(attack) || attackHasManeuver(attack))throw new Error('Este ataque já mudou ou já usou uma manobra.');
  attack.precisionUsed=true;
}
export function finishWeaponAttack(c:Sheet,entry:Sheet) {
  if(currentWeaponAttack(c,entry))attacks.delete(entry);
  if(lungingAttacks.get(c)?.entry===entry)lungingAttacks.delete(c);
}
/** Outro ataque, erro ou encerramento elimina apenas o contexto efêmero;
 * o dado já gasto nunca é devolvido por esta limpeza. */
export function finishLungingAttack(c:Sheet) {
  const old=lungingAttacks.get(c);if(old)finishWeaponAttack(c,old.entry);
  return old;
}
export function clearWeaponAttacks(){attacks=new WeakMap();lungingAttacks=new WeakMap();}
