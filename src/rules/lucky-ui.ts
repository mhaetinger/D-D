import { addLuckyDie, chooseLuckyDie, evaluateDicePool, luckyFaces, type DiceResult } from './dice-roll';
import { luckRemaining, luckyResource, spendLuck } from './lucky';
import { consumeInspiration } from './health';
import { chooseDieSource, dieSourceControls } from './health-ui';
import type { Engine, Sheet } from './model';

export function refreshLuckyControls(c:Sheet,E:Engine) {
  const count=luckRemaining(c,E);
  for(const el of document.querySelectorAll('[data-lucky-balance]'))el.textContent=String(count);
  for(const el of document.querySelectorAll<HTMLButtonElement>('[data-lucky-action]'))el.disabled=count<1;
  for(const el of document.querySelectorAll<HTMLButtonElement>('[data-resource="feat:lucky"][data-rule-action="refund"]')) {
    const value=c.ruleState?.used?.['feat:lucky'];
    el.disabled=count===luckyResource(c,E)?.max || value!==undefined && (!Number.isInteger(value) || value<0);
  }
}
/** O ponto paga o lançamento, não a escolha de um resultado melhor. Salva
 * antes de mostrar o dado, preservando os nós/rascunhos do dano em andamento. */
export function payLuckyPoint(c:Sheet,E:Engine,label:string,inspired=false) {
  const host=window as any;
  if(host.getChar()!==c)throw new Error('A ficha mudou; nenhum ponto foi gasto.');
  spendLuck(c,E);
  const inspiration=inspired && consumeInspiration(c);
  host.recordStepAndSave(`Gastou 1 ponto de Sortudo · ${label}${inspiration?' · usou inspiração':''}`,true,false);
  refreshLuckyControls(c,E);
}
export async function chooseLuckyFace(result:DiceResult,label:string):Promise<DiceResult|null> {
  if(!result.luck || result.luck.canceled)return result;
  const host=window as any,controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
  const faces=luckyFaces(result),selected=result.luck.selected;
  controls.innerHTML=faces.map((face,i)=>`<label class="rule-check"><input type="radio" name="luckyFace" data-lucky-face value="${i}" ${i===selected?'checked':''}><span>${i===faces.length-1?'Dado de Sortudo':`Dado inicial ${i+1}`}: <strong>${face}</strong></span></label>`).join('');
  const mode={normal:'normal',adv:'vantagem',dis:'desvantagem'}[result.appliedMode];
  if(!await host.confirmDestructiveAction('Sortudo · escolher d20',`${label}. Escolha qualquer face; o modo ${mode} continua valendo. O ponto já foi gasto ao rolar. Cancelar interrompe a aplicação do resultado.`, 'Usar face escolhida',controls)) {
    host.showToast('Resultado não aplicado. O ponto de Sortudo já foi gasto ao rolar.');return null;
  }
  return chooseLuckyDie(result,Number(controls.querySelector<HTMLInputElement>('[data-lucky-face]:checked')!.value));
}
export async function askToUseLucky(result:DiceResult,label:string):Promise<{use:boolean;opposed:boolean}|null> {
  const host=window as any,controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
  controls.innerHTML='<label>Decisão <select data-lucky-decision><option value="keep">Manter o d20 inicial</option><option value="use">Gastar 1 ponto de Sortudo</option></select></label><label class="rule-check" data-lucky-opposed-label hidden><input type="checkbox" data-lucky-opposed><span>Outra criatura também usou Sortudo nesta jogada</span></label>';
  controls.addEventListener('change',()=>{controls.querySelector<HTMLElement>('[data-lucky-opposed-label]')!.hidden=controls.querySelector<HTMLSelectElement>('[data-lucky-decision]')!.value!=='use';});
  if(!await host.confirmDestructiveAction('Sortudo · depois do d20',`${label}: d20 escolhido ${result.d20Natural}. Decida antes de resolver o teste. Cancelar deixa estes dados pendentes para retomar; o ponto ainda não foi gasto.`,'Continuar',controls))return null;
  return {use:controls.querySelector<HTMLSelectElement>('[data-lucky-decision]')!.value==='use',opposed:controls.querySelector<HTMLInputElement>('[data-lucky-opposed]')!.checked};
}

export function setupLuckyUI(E:Engine,save:(description:string)=>void) {
  const host=window as any,busy=new WeakSet<Sheet>();
  document.addEventListener('click',async event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-lucky-action]');
    if(!button || button.disabled)return;
    const c=host.getChar(),kind=button.dataset.luckyAction;
    if(!c || busy.has(c) || !['table','incoming'].includes(kind || ''))return;
    busy.add(c);
    try {
      const before=JSON.stringify(c),controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
      const opposed='<label class="rule-check"><input type="checkbox" data-lucky-opposed><span>Outra criatura também usou Sortudo nesta jogada</span></label>';
      if(kind==='table') {
        controls.innerHTML=opposed;
        if(!await host.confirmDestructiveAction('Sortudo · usar na mesa','Registra 1 ponto para uma jogada resolvida com dados físicos. Escolha a face na mesa antes de resolver o resultado. Criaturas diferentes usando Sortudo na mesma jogada gastam seus pontos e cancelam os dados adicionais.','Gastar 1 ponto',controls))return;
        if(host.getChar()!==c || JSON.stringify(c)!==before)throw new Error('A ficha mudou; nenhum ponto foi gasto.');
        spendLuck(c,E);save('Usou 1 ponto de Sortudo na mesa'+(controls.querySelector<HTMLInputElement>('[data-lucky-opposed]')!.checked?' · pontos de criaturas diferentes cancelados':''));return;
      }
      controls.innerHTML=`<label>Face do d20 do atacante, já escolhida <input type="number" min="1" max="20" step="1" required data-lucky-attacker></label>${dieSourceControls(20,false)}${opposed}<p>A face escolhida substitui o d20 do ataque. Bônus do atacante, acerto e dano são resolvidos na mesa.</p>`;
      controls.querySelector('[data-health-face-label]')!.firstChild!.textContent='Seu d20 adicional ';
      chooseDieSource(controls);
      const update=()=>{
        const hidden=controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual' || controls.querySelector<HTMLInputElement>('[data-lucky-opposed]')!.checked;
        const field=controls.querySelector<HTMLInputElement>('[data-health-face]')!;
        field.disabled=hidden;field.required=!hidden;controls.querySelector<HTMLElement>('[data-health-face-label]')!.hidden=hidden;
      };
      controls.addEventListener('change',update);update();
      if(!await host.confirmDestructiveAction('Sortudo · ataque contra você','Gasta 1 ponto ao lançar/registrar seu d20 adicional. Você escolhe depois entre ele e a face do atacante. Não altera seus PV.','Gastar e continuar',controls))return;
      if(host.getChar()!==c || JSON.stringify(c)!==before)throw new Error('A ficha mudou; nenhum ponto foi gasto.');
      const face=Number(controls.querySelector<HTMLInputElement>('[data-lucky-attacker]')!.value),canceled=controls.querySelector<HTMLInputElement>('[data-lucky-opposed]')!.checked;
      const virtual=controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual',physical=Number(controls.querySelector<HTMLInputElement>('[data-health-face]')!.value);
      if(virtual && !host.ruleDiceSettings().enabled)throw new Error('Dados virtuais desativados; nenhum ponto foi gasto.');
      if(!Number.isInteger(face) || face<1 || face>20 || !canceled && !virtual && (!Number.isInteger(physical) || physical<1 || physical>20))throw new Error('Informe faces do d20 entre 1 e 20.');
      const original=evaluateDicePool({20:1},0,'normal',{luckyFeat:true},()=>face);
      payLuckyPoint(c,E,'ataque contra você');
      const snapshot=JSON.stringify(c),extra=canceled?null:virtual?host.rollRuleDie(20,'Sortudo · d20 adicional','normal'):physical;
      const result=addLuckyDie(original,extra);
      host.presentRuleDiceResult(result,'Sortudo · d20 do ataque contra você');
      const chosen=await chooseLuckyFace(result,'Ataque contra você');if(!chosen)return;
      if(host.getChar()!==c || JSON.stringify(c)!==snapshot)throw new Error('A ficha mudou. A face antiga não foi aplicada; o ponto lançado continua gasto.');
      host.presentRuleDiceResult(chosen,'Sortudo · d20 do ataque contra você (bônus/acerto na mesa)',null,false);
    }catch(error){host.showToast(error instanceof Error?error.message:'Não foi possível usar Sortudo.');}
    finally{busy.delete(c);}
  });
}
