import {ability,active,level,subclass,type Engine,type Sheet} from './model';
import {deathStatus,healHitPoints,hitPointMaximum} from './health';

export const hasSurvivor=(c:Sheet,E:Engine)=>level(c,'guerreiro')>=18 && subclass(c,'guerreiro',E)==='campeao';

/** PHB 2014: a metade é requisito ANTES da cura, não teto depois dela.
 * É um benefício passivo: incapacitação/sono com PV positivos não o impedem.
 * A besta ainda não tem CON/PV integrados; não usamos valores humanos nela. */
export function previewSurvivor(c:Sheet,E:Engine) {
  if(!hasSurvivor(c,E))throw new Error('Sobrevivente exige Guerreiro Campeão de nível próprio 18.');
  // healHitPoints grava o estado após somar PV. Recuse um contêiner ilegível
  // antes dessa mutação, em vez de descobrir o erro depois de curar.
  if(c.ruleState!=null && (typeof c.ruleState!=='object' || Array.isArray(c.ruleState)))throw new Error('Registro de regras ilegível preservado; confira a ficha antes de usar Sobrevivente.');
  if(deathStatus(c).dead)throw new Error('Sobrevivente não revive o personagem.');
  if(active(c,'druida:wildShape'))throw new Error('Forma Selvagem: resolva Sobrevivente com os PV e a Constituição da besta na mesa.');
  const before=c.hpCurrent,maximum=hitPointMaximum(c),score=Number(c.abilities?.con?.score);
  if(!Number.isSafeInteger(c.hpMax) || c.hpMax<1 || !Number.isSafeInteger(maximum) || maximum<1 || !Number.isSafeInteger(before) || before<0 || before>maximum)throw new Error('Confira os PV atuais e o máximo vigente; valores preservados.');
  if(before===0)throw new Error('Sobrevivente não funciona com 0 PV, mesmo estável.');
  if(before>maximum/2)throw new Error('Sobrevivente exige até metade dos PV máximos vigentes.');
  if(!Number.isSafeInteger(score) || score<1 || score>30)throw new Error('Confira a Constituição antes de usar Sobrevivente; valor preservado.');
  const con=ability(c,'con'),amount=5+con,after=Math.min(maximum,before+amount);
  return {before,maximum,con,amount,after,restored:after-before};
}
/** Não deduz turnos do dado, da iniciativa, de uma recarga ou de outro clique.
 * A mesa declara um novo começo de turno; não existe contador de turnos no app. */
export function applySurvivor(c:Sheet,E:Engine,startOfTurn:boolean) {
  if(startOfTurn!==true)throw new Error('Confirme o início de um novo turno, sem repetir Sobrevivente no mesmo turno.');
  const plan=previewSurvivor(c,E);
  if(plan.restored===0)throw new Error('A Constituição atual resulta em 0 PV de recuperação.');
  healHitPoints(c,plan.amount);return plan;
}
