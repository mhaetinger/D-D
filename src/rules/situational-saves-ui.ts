import {escape,level,type Engine,type Sheet} from './model';
import {SAVE_ABILITIES,SAVE_EFFECTS,situationalSaveDetails,situationalSaveSources,type SaveSituation} from './situational-saves';
import {landPurity} from './defensive-traits';
import {hasFeat} from './passives';
import {chooseDieSource,dieSourceControls} from './health-ui';
import {consumeInspiration} from './health';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';
import type {RollMode} from './dice-roll';

export function situationalSaveControls(c:Sheet,E:Engine) {
  const sources=situationalSaveSources(c,E);if(!sources.length)return '';
  const text='Fontes condicionais: '+sources.join(', ')+'. Informe o efeito para esta resistência. Os botões normais mantêm o bônus base; não presumem veneno, encanto, magia, visibilidade ou alvo exclusivo.';
  return `<div class="rule-controls"><button type="button" data-rule-save-context ${canEditSheet(c)?'':'disabled'} data-rule-tooltip="${escape(JSON.stringify({name:'Resistência com contexto · 2014',text}))}">Resistência com contexto</button><output data-rule-save-result role="status" class="min-w-0 break-words basis-full" hidden></output></div>`;
}
const pending=new WeakSet<Sheet>();
const signed=(n:number)=>(n>=0?'+':'')+n;
export function setupSituationalSavesUI(E:Engine,save:(description:string)=>void) {
  const host=window as any;
  document.addEventListener('click',async event=>{
    const trigger=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-rule-save-context]');if(!trigger || trigger.disabled)return;
    const c=host.getChar();if(!c || pending.has(c))return;pending.add(c);
    try {
      const before=JSON.stringify(c),scope=currentWorkspaceKey(),settings=JSON.stringify(host.ruleDiceSettings());
      const valid=()=>host.getChar()===c && trigger.isConnected && currentWorkspaceKey()===scope && canEditSheet(c) && JSON.stringify(c)===before;
      if(!valid())throw new Error('A ficha ou a permissão mudou.');
      const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
      controls.innerHTML=`<label>Resistência de <select data-save-ability>${SAVE_ABILITIES.map(([id,name])=>`<option value="${id}" ${id==='wis'?'selected':''}>${name}</option>`).join('')}</select></label><label>Efeito que estou resistindo <select data-save-effect>${SAVE_EFFECTS.map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><label>Origem <select data-save-magic><option value="none">Não mágico</option><option value="spell">Magia conjurada</option><option value="other">Outro efeito mágico</option></select></label>${landPurity(c)?'<label>Criatura de origem <select data-save-creature><option value="other">Outra / não informada</option><option value="fey">Fada</option><option value="elemental">Elemental</option></select></label>':''}${level(c,'barbaro')>=2?'<label class="rule-check"><input type="checkbox" data-save-visible> Posso ver este efeito · Sentido de Perigo</label>':''}${hasFeat(c,E,'Mestre de Escudo')?'<label class="rule-check"><input type="checkbox" data-save-only> Sou o único alvo · não é área</label>':''}${hasFeat(c,E,'Matador de Conjuradores')?'<label class="rule-check"><input type="checkbox" data-save-near> Quem conjurou está a até 1,5 m de mim</label>':''}<details data-save-adjustments><summary>Modo, CD e ajuste</summary><div class="rule-dialog-fields"><label>Modo informado pela mesa <select data-save-mode><option value="normal">Normal</option><option value="adv">Vantagem</option><option value="dis">Desvantagem</option></select></label><label>Ajuste que ainda não entrou no bônus <input type="number" min="-100" max="100" step="1" value="0" required data-save-extra></label><label>CD · opcional <input type="number" min="1" max="1000" step="1" data-save-dc></label></div></details>${dieSourceControls(20,false)}<output data-save-preview role="status" aria-live="polite"></output><p>Face física: informe o resultado final. Sortudo e outras rerrolagens: na mesa. Efeitos compostos: confira cada parte.</p>`;
      chooseDieSource(controls);controls.querySelector<HTMLSelectElement>('[data-save-mode]')!.value=host.ruleDiceSettings().mode;
      const value=(attr:string)=>controls.querySelector<HTMLSelectElement|HTMLInputElement>(`[${attr}]`)?.value;
      const checked=(attr:string)=>controls.querySelector<HTMLInputElement>(`[${attr}]`)?.checked || false;
      const read=():SaveSituation=>({ability:value('data-save-ability')!,effect:value('data-save-effect') as SaveSituation['effect'],magic:value('data-save-magic') as SaveSituation['magic'],creature:(value('data-save-creature') || 'other') as SaveSituation['creature'],visible:checked('data-save-visible'),onlyTarget:checked('data-save-only'),casterNear:checked('data-save-near')});
      const details=()=>situationalSaveDetails(c,read(),value('data-save-mode') as RollMode,E,Number(value('data-save-extra')));
      const description=(d:ReturnType<typeof details>)=>`Bônus base ${signed(d.base)}${d.shield?` + escudo ${d.shield} (somente este teste)`:''}${d.extra?` + ajuste (${signed(d.extra)})`:''} = ${signed(d.bonus)} · ${d.mode==='adv'?'vantagem':d.mode==='dis'?'desvantagem':'normal'}${d.advantage.length?' · Vantagem: '+d.advantage.join(', '):''}${d.disadvantage.length?' · Desvantagem: '+d.disadvantage.join(', '):''}.`;
      const update=()=>{
        let noRoll=false;
        try {const d=details();noRoll=!!d.immunity.length || d.automaticFailure;controls.querySelector<HTMLOutputElement>('[data-save-preview]')!.textContent=d.immunity.length?'Imune a este efeito: '+d.immunity.join(', ')+'. Sem rolagem ou gasto de inspiração; outras partes do efeito ficam na mesa.':d.automaticFailure?'Falha automática de FOR/DES pela condição atual. Sem rolar ou gastar inspiração.':description(d);}
        catch(error){controls.querySelector<HTMLOutputElement>('[data-save-preview]')!.textContent=(error as Error).message;}
        const source=controls.querySelector<HTMLSelectElement>('[data-health-source]')!,face=controls.querySelector<HTMLInputElement>('[data-health-face]')!;
        source.disabled=noRoll;face.disabled=noRoll || source.value==='virtual';face.required=!face.disabled;
        controls.querySelector<HTMLElement>('[data-health-face-label]')!.hidden=face.disabled;
      };
      controls.addEventListener('input',update);controls.addEventListener('change',update);update();
      const decision=host.confirmDestructiveAction('Resistência com contexto · 2014','Esta escolha vale para um único teste. A ficha reúne as fontes e cancela vantagem/desvantagem uma única vez. O bônus mostrado na folha não muda.','Registrar teste',controls);
      // Começa pelo atributo, sem o autofocus de Cancelar levar o formulário
      // comprido ao rodapé no celular. Só rola a janela compartilhada.
      if(controls.isConnected){controls.querySelector<HTMLElement>('[data-save-ability]')!.focus({preventScroll:true});controls.closest('dialog')!.scrollTop=0;}
      if(!await decision)return;
      if(!valid() || JSON.stringify(host.ruleDiceSettings())!==settings)throw new Error('A ficha, a conta, a permissão ou o dado mudou. Nenhum teste novo foi realizado.');
      const d=details(),s=read(),ability=SAVE_ABILITIES.find(x=>x[0]===s.ability)![1],effect=SAVE_EFFECTS.find(x=>x[0]===s.effect)![1];
      let text:string;
      if(d.immunity.length)text=`${effect}: imune por ${d.immunity.join(', ')}. Sem rolagem ou gasto de inspiração. Registros e demais efeitos preservados.`;
      else if(d.automaticFailure)text=`Resistência de ${ability}: falha automática pela condição atual. Sem rolagem ou gasto de inspiração.`;
      else {
        const virtual=value('data-health-source')==='virtual',face=Number(value('data-health-face')),dc=value('data-save-dc')?.trim()?Number(value('data-save-dc')):null;
        if(dc!==null && (!Number.isSafeInteger(dc) || dc<1 || dc>1000))throw new Error('Informe uma CD inteira de 1 a 1.000 ou deixe vazia.');
        if(virtual && !host.ruleDiceSettings().enabled)throw new Error('Dados virtuais desligados; informe a face física.');
        if(!virtual && (!value('data-health-face')?.trim() || !Number.isInteger(face) || face<1 || face>20))throw new Error('Informe a face final do d20, entre 1 e 20.');
        // Não há espera entre validar, rolar e consumir. O resultado reutiliza
        // animação/motor, mantendo o pool manual e os bônus da folha intactos.
        const natural=virtual?host.rollRuleDie(20,'Resistência de '+ability,d.mode,{type:'save',ability:s.ability}):face;
        if(!Number.isInteger(natural) || natural<1 || natural>20)throw new Error('Resultado de d20 inválido.');
        const inspired=d.inspired && consumeInspiration(c),total=natural+d.bonus;
        text=`Resistência de ${ability} · ${effect}: d20 ${natural} ${signed(d.bonus)} = ${total}${dc!==null?` / CD ${dc} · ${total>=dc?'sucesso':'falha'}`:''}. ${description(d)}${inspired?' Inspiração usada.':''} Efeitos na mesa.`;
        save(text);
      }
      for(const output of document.querySelectorAll<HTMLOutputElement>('[data-rule-save-result]')){output.hidden=false;output.textContent=text;}host.showToast(text);
    }catch(error){host.showToast((error as Error).message);}finally{pending.delete(c);}
  });
}
