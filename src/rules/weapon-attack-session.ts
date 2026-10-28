import type {Sheet} from './model';

export interface WeaponAttackSession {c:Sheet;entry:Sheet;precisionUsed:boolean}
let attacks=new WeakMap<Sheet,WeaponAttackSession>();
/** Identifica só o ataque automático acompanhado nesta sessão. Não inventa
 * turnos nem salva faces no documento; outra jogada desta arma inicia outro ataque. */
export function beginWeaponAttack(c:Sheet,entry:Sheet):WeaponAttackSession {
  const attack={c,entry,precisionUsed:false};attacks.set(entry,attack);return attack;
}
export function currentWeaponAttack(c:Sheet,entry:Sheet):WeaponAttackSession|undefined {
  if(!entry)return;
  const attack=attacks.get(entry);
  return attack?.c===c && c.weapons?.includes(entry)?attack:undefined;
}
export const isCurrentWeaponAttack=(attack:WeaponAttackSession)=>currentWeaponAttack(attack.c,attack.entry)===attack;
export function markAttackPrecision(attack:WeaponAttackSession) {
  if(!isCurrentWeaponAttack(attack) || attack.precisionUsed)throw new Error('Este ataque já mudou ou já usou Precisão.');
  attack.precisionUsed=true;
}
export function finishWeaponAttack(c:Sheet,entry:Sheet) {
  if(currentWeaponAttack(c,entry))attacks.delete(entry);
}
export function clearWeaponAttacks(){attacks=new WeakMap();}
