import {active,type Engine,type Sheet} from './model';
import {hasFeat} from './passives';
import {incapacityReason} from './concentration';

export const canShieldMaster=(c:Sheet,E:Engine)=>hasFeat(c,E,'Mestre de Escudo') && c.shieldEquipped===true && !active(c,'druida:wildShape') && !incapacityReason(c);
/** Só o bônus do escudo, incluindo sua magia; não usa a CA total nem a magia
 * Escudo Arcano. Só o chamador com alvo exclusivo pode somá-lo ao teste. */
export function shieldSaveBonus(c:Sheet,E:Engine) {
  if(!canShieldMaster(c,E))throw new Error('Mestre de Escudo exige escudo empunhado e capacidade de agir; Forma Selvagem continua na mesa.');
  const magic=c.shieldMagicBonus ?? Number(String(c.shieldName).match(/\+([1-3])\b/)?.[1] || 0);
  if(typeof magic!=='number' || !Number.isSafeInteger(magic) || magic<0 || magic>100)throw new Error('Bônus mágico do escudo inválido preservado; confira a ficha.');
  return 2+magic;
}
