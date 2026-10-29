import type {Sheet} from './model';
import {clearFeints,type PaidFeint} from './feinting-state';
import {clearCommands} from './commanders-strike-state';
import {clearMonkReturns} from './monk-state';

export interface PaidLungingAttack {source:string;name:string;die:number}
export interface PaidRiposte extends PaidLungingAttack {target:string}
export interface WeaponAttackSession {c:Sheet;entry:Sheet;precisionUsed:boolean;lunging?:PaidLungingAttack;feinting?:PaidFeint;riposte?:PaidRiposte}
let attacks=new WeakMap<Sheet,WeaponAttackSession>();
let lungingAttacks=new WeakMap<Sheet,WeaponAttackSession>();
let feintingAttacks=new WeakMap<Sheet,WeaponAttackSession>();
let riposteAttacks=new WeakMap<Sheet,WeaponAttackSession>();
/** Identifica o ataque acompanhado nesta sessão, automático ou físico declarado. Não inventa
 * turnos nem salva faces no documento; outra jogada desta arma inicia outro ataque. */
export function beginWeaponAttack(c:Sheet,entry:Sheet,lunging?:PaidLungingAttack):WeaponAttackSession {
  finishLungingAttack(c);
  finishFeintingAttack(c);
  finishRiposte(c);
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
export const attackHasManeuver=(attack:WeaponAttackSession|undefined)=>!!(attack?.precisionUsed || attack?.lunging || attack?.feinting || attack?.riposte);
export function markAttackPrecision(attack:WeaponAttackSession) {
  if(!isCurrentWeaponAttack(attack) || attackHasManeuver(attack))throw new Error('Este ataque já mudou ou já usou uma manobra.');
  attack.precisionUsed=true;
}
export function finishWeaponAttack(c:Sheet,entry:Sheet) {
  if(currentWeaponAttack(c,entry))attacks.delete(entry);
  if(lungingAttacks.get(c)?.entry===entry)lungingAttacks.delete(c);
  if(feintingAttacks.get(c)?.entry===entry)feintingAttacks.delete(c);
  if(riposteAttacks.get(c)?.entry===entry)riposteAttacks.delete(c);
}
/** Outro ataque, erro ou encerramento elimina apenas o contexto efêmero;
 * o dado já gasto nunca é devolvido por esta limpeza. */
export function finishLungingAttack(c:Sheet) {
  const old=lungingAttacks.get(c);if(old)finishWeaponAttack(c,old.entry);
  return old;
}
export const currentFeintingAttack=(c:Sheet)=>feintingAttacks.get(c);
export function beginFeintingWeaponAttack(c:Sheet,entry:Sheet,feinting:PaidFeint) {
  const attack=beginWeaponAttack(c,entry);attack.feinting=feinting;feintingAttacks.set(c,attack);return attack;
}
export function finishFeintingAttack(c:Sheet) {
  const old=feintingAttacks.get(c);if(old)finishWeaponAttack(c,old.entry);return old;
}
export function currentRiposte(c:Sheet) {const attack=riposteAttacks.get(c);return attack && isCurrentWeaponAttack(attack)?attack:undefined;}
export function beginRiposte(c:Sheet,entry:Sheet,riposte:PaidRiposte) {
  const attack=beginWeaponAttack(c,entry);attack.riposte=riposte;riposteAttacks.set(c,attack);return attack;
}
export function finishRiposte(c:Sheet) {
  const old=riposteAttacks.get(c);if(old)finishWeaponAttack(c,old.entry);return old;
}
export function clearWeaponAttacks(){attacks=new WeakMap();lungingAttacks=new WeakMap();feintingAttacks=new WeakMap();riposteAttacks=new WeakMap();clearFeints();clearCommands();clearMonkReturns();}
