import type {Engine,Sheet} from './model';
import {currentWeaponAttack,finishWeaponAttack,type WeaponAttackSession} from './weapon-attack-session';
import {previewCombatAction,type CombatActionChoice} from './combat-actions';

interface Action {entry:Sheet;attack:WeaponAttackSession;choice:CombatActionChoice;snapshot:string;stale:boolean}
let actions=new WeakMap<Sheet,Action>();
/** Gastos do próprio d20 não mudam o ataque já declarado. Todo o restante
 * do documento é vinculado; editar e voltar ao valor antigo não o restaura. */
function fingerprint(c:Sheet) {
 const {heroicInspiration,...copy}=c,s=c.ruleState,used={...s?.used};delete used['feat:lucky'];
 return JSON.stringify({...copy,ruleState:s?{...s,inspirationReady:undefined,used}:s});
}
export function holdCombatAction(c:Sheet,entry:Sheet,attack:WeaponAttackSession,choice:CombatActionChoice,E:Engine) {
 previewCombatAction(c,entry,choice,E);finishCombatAction(c);
 if(currentWeaponAttack(c,entry)!==attack)throw new Error('O ataque mudou antes da preparação.');
 actions.set(c,{entry,attack,choice:{...choice},snapshot:fingerprint(c),stale:false});
}
export function combatActionState(c:Sheet,entry:Sheet) {
 const a=actions.get(c);if(!a || a.entry!==entry || currentWeaponAttack(c,entry)!==a.attack)return;
 if(fingerprint(c)!==a.snapshot)a.stale=true;
 return a;
}
export function combatActionPlan(c:Sheet,entry:Sheet,E:Engine) {
 const a=combatActionState(c,entry);return a && !a.stale?previewCombatAction(c,entry,a.choice,E):undefined;
}
/** Precisão/Atordoante pertencem ao mesmo ataque. Só sua transação síncrona,
 * iniciada com contexto válido, pode atualizar o snapshot após pagar custo. */
export function withCombatActionCost<T>(c:Sheet,entry:Sheet,apply:()=>T):T {
 const a=combatActionState(c,entry),valid=a && !a.stale,result=apply();
 if(valid && currentWeaponAttack(c,entry)===a.attack)a.snapshot=fingerprint(c);
 return result;
}
export function finishCombatAction(c:Sheet) {
 const a=actions.get(c);actions.delete(c);if(a && currentWeaponAttack(c,a.entry)===a.attack)finishWeaponAttack(c,a.entry);return a;
}
export function clearCombatActions(){actions=new WeakMap();}
