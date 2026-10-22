import { resourcesFor, remaining, spend } from './resources';
import type { Engine, Sheet } from './model';

export function luckyResource(c:Sheet,E:Engine) {
  return resourcesFor(c,E).find(r=>r.id==='feat:lucky');
}
/** Não transformar um registro ilegível em pontos novos. O original permanece
 * no documento para conferência; a recuperação normal é o descanso da ficha. */
export function luckRemaining(c:Sheet,E:Engine) {
  const resource=luckyResource(c,E),value=c.ruleState?.used?.['feat:lucky'];
  if(!resource || value!==undefined && (!Number.isInteger(value) || value<0))return 0;
  return remaining(c,resource);
}
export function spendLuck(c:Sheet,E:Engine) {
  const resource=luckyResource(c,E);
  if(!resource || !(luckRemaining(c,E)>=1))throw new Error('Sem pontos disponíveis do talento Sortudo. Confira o talento e sua reserva.');
  // Não exige consciência: o talento também pode ser usado num teste de morte.
  spend(c,resource);
}
