import {weaponStats} from './combat';
import {hasFeat} from './passives';
import {active,type Engine,type Sheet} from './model';

/** A escolha é por ataque, antes do d20. Não altera os totais cadastrados.
 * Arremessar uma arma corpo a corpo não a transforma em arma à distância;
 * Dardo, por outro lado, já pertence à categoria de armas à distância. */
export function weaponPowerAttackOption(c:Sheet,entry:Sheet,E:Engine) {
  if(!entry || !c.weapons?.includes(entry) || active(c,'druida:wildShape'))return null;
  const w=weaponStats(c,entry,E);
  if(!w.ruleWeapon || w.calculationMode==='manual' || !w.proficient || !w.weaponDie || w.weaponDie==='0')return null;
  if(w.rangedWeapon && hasFeat(c,E,'Atirador Aguçado'))return {name:'Atirador Aguçado',type:w.dmgTypeLabel};
  // Arremesso improvisado de arma pesada não vira um ataque corpo a corpo.
  if(w.meleeAttack && entry.attackMode!=='thrown' && /pesada/i.test(w.properties) && hasFeat(c,E,'Mestre de Armas Grandes'))return {name:'Mestre de Armas Grandes',type:w.dmgTypeLabel};
  return null;
}

export function weaponPowerAttack(c:Sheet,entry:Sheet,selected:boolean,E:Engine) {
  if(typeof selected!=='boolean')throw new Error('Confira a escolha de –5 no ataque / +10 no dano.');
  if(!selected)return null;
  const option=weaponPowerAttackOption(c,entry,E);
  if(!option)throw new Error('O talento, a proficiência e esta arma não permitem –5 no ataque / +10 no dano.');
  return {...option,attack:-5,damage:10};
}
