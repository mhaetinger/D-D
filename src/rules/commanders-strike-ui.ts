import {escape,type Engine,type Sheet} from './model';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';
import {currentCommand} from './commanders-strike-state';
import {knowsCommandersStrike,canCommandersStrike,issueCommandersStrike,previewCommandResult,finishCommandResult,type CommandResultChoice} from './commanders-strike';
import {dieSourceControls,chooseDieSource} from './health-ui';

const pending=new WeakSet<Sheet>();
export function commandersStrikeControls(c:Sheet,E:Engine,source:string) {
  const command=currentCommand(c);
  if(!knowsCommandersStrike(c,E) && command?.source!==source)return '';
  const text='Golpe do Comandante (2014): na ação Atacar do seu turno, ceda UM ataque e gaste ação bônus e um dado. Uma criatura amigável que possa ver ou ouvir você pode usar a própria reação imediatamente para um ataque com arma, corpo a corpo ou à distância. Se acertar, soma seu dado ao dano; no crítico, dobra o dado. Gasta mesmo se o aliado errar ou não reagir. Não precisa de Ataque Extra. Arma, alcance, alvo, recursos e defesas do aliado ficam na mesa; não são usados os bônus desta ficha.';
  return `<span data-command-controls="${source}" class="contents"><button type="button" data-command-action="start" data-command-source="${source}" data-rule-tooltip="${escape(JSON.stringify({name:'Golpe do Comandante',text}))}" ${!canEditSheet(c) || !canCommandersStrike(c,E,source)?'disabled':''}>Comandar ataque</button>${command?.source===source?`<span class="basis-full min-w-0 break-words" data-command-status role="status"><strong>Golpe do Comandante · ${escape(command.ally)}</strong> · ${escape(command.name)} d${command.die} já pago. O aliado decide a reação imediata na mesa.<span class="rule-controls"><button type="button" data-command-action="result" ${!canEditSheet(c)?'disabled':''}>Registrar ataque do aliado</button><button type="button" data-command-action="end" ${!canEditSheet(c)?'disabled':''}>Já resolvido na mesa / encerrar</button></span></span>`:''}<output data-command-result="${source}" role="status" class="basis-full min-w-0 break-words" hidden></output></span>`;
}
export function setupCommandersStrikeUI(E:Engine,save:(description:string)=>void) {
  const host=window as any;
  document.addEventListener('click',async event=>{
    const trigger=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-command-action]');if(!trigger || trigger.disabled)return;
    const c=host.getChar();if(!c || pending.has(c))return;
    pending.add(c);
    try{
      const command=currentCommand(c),before=JSON.stringify(c),scope=currentWorkspaceKey(),settings=JSON.stringify(host.ruleDiceSettings());
      const valid=()=>host.getChar()===c && currentWorkspaceKey()===scope && JSON.stringify(c)===before && trigger.isConnected && canEditSheet(c) && currentCommand(c)===command && JSON.stringify(host.ruleDiceSettings())===settings;
      if(!valid())throw new Error('A ficha, a permissão ou a ordem mudou. Confira antes de continuar.');
      const action=trigger.dataset.commandAction;
      if(action==='start'){
        const source=trigger.dataset.commandSource!;
        if(!canCommandersStrike(c,E,source))throw new Error('Golpe do Comandante indisponível; confira manobra, reserva e condição.');
        const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
        controls.innerHTML='<label>Criatura amigável <input type="text" required maxlength="80" autocomplete="off" data-command-ally></label><label class="rule-check"><input type="checkbox" required data-command-turn> Estou na ação Atacar do meu turno, cedo um ataque ainda não realizado e tenho ação bônus disponível</label><label class="rule-check"><input type="checkbox" required data-command-perceives> A criatura é amigável e pode me ver ou ouvir; ela decide se usa a reação imediatamente</label><p>Gasta um dado agora, mesmo se o aliado errar ou não reagir. Não role seu ataque nem o dado de dano ainda. O aliado pode fazer um ataque com arma corpo a corpo ou à distância, usando os próprios valores. O restante dos seus ataques fica na mesa. Não gaste novamente em Usar na mesa.</p>';
        if(!await host.confirmDestructiveAction('Golpe do Comandante · dar a ordem','Regras de 2014: um ataque cedido + sua ação bônus + um dado de superioridade. A reação é do aliado.','Gastar dado e comandar',controls))return;
        if(!valid())throw new Error('A ficha, a conta, o dado ou a ordem mudou. Nenhum dado foi gasto.');
        const declared=controls.querySelector<HTMLInputElement>('[data-command-turn]')!.checked;
        const paid=issueCommandersStrike(c,{source,ally:controls.querySelector<HTMLInputElement>('[data-command-ally]')!.value,ownTurn:declared,attackAction:declared,forgoAttack:declared,bonusAction:declared,friendlyPerceiving:controls.querySelector<HTMLInputElement>('[data-command-perceives]')!.checked},E);
        save(`Golpe do Comandante · ${paid.ally} · ação Atacar no próprio turno, um ataque cedido e ação bônus confirmados · gastou 1 dado de ${paid.name} (d${paid.die}); aliado decide reação imediata para um ataque com arma na mesa`);return;
      }
      if(!command)throw new Error('A ordem não está mais ativa; o dado já gasto permanece.');
      let choice:CommandResultChoice={outcome:'declined',declared:false},faces:number[]=[];
      if(action==='result'){
        const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
        controls.innerHTML=`<p class="min-w-0 break-words"><strong>${escape(command.ally)}</strong> · ${escape(command.name)} d${command.die} já pago. Registre somente o dado adicional.</p><label>Resultado do ataque imediato do aliado <select required data-command-outcome><option value="">Conferir na mesa…</option><option value="hit">Acertou · 1d${command.die}</option><option value="critical">Crítico · 2d${command.die}</option><option value="miss">Errou · sem dano</option><option value="declined">Não realizou o ataque</option></select></label><label class="rule-check" data-command-declared-label hidden><input type="checkbox" data-command-declared> O aliado usou reação imediatamente para esse ataque com arma e acertou; este dado ainda não foi incluído no dano</label><fieldset data-command-dice hidden class="min-w-0">${dieSourceControls(command.die,false)}<label data-command-face2-label hidden>Segunda face do d${command.die} · crítico <input type="number" min="1" max="${command.die}" step="1" data-command-face2></label></fieldset><output data-command-preview role="status" class="min-w-0 break-words"></output><p>O aliado resolve arma, bônus, alcance, recursos e defesas na mesa. Esse controle soma apenas o dado já pago; não rola outro ataque nem usa os bônus desta ficha. Não inclua o dado duas vezes.</p>`;
        chooseDieSource(controls);
        const source=controls.querySelector<HTMLSelectElement>('[data-health-source]')!,outcome=controls.querySelector<HTMLSelectElement>('[data-command-outcome]')!;
        const readChoice=():CommandResultChoice=>({outcome:outcome.value as CommandResultChoice['outcome'],declared:controls.querySelector<HTMLInputElement>('[data-command-declared]')!.checked});
        const update=()=>{
          const count=outcome.value==='critical'?2:outcome.value==='hit'?1:0,virtual=source.value==='virtual',fields=controls.querySelector<HTMLFieldSetElement>('[data-command-dice]')!;
          fields.hidden=!count;fields.disabled=!count;
          const declared=controls.querySelector<HTMLInputElement>('[data-command-declared]')!;declared.required=!!count;declared.disabled=!count;controls.querySelector<HTMLElement>('[data-command-declared-label]')!.hidden=!count;
          const first=controls.querySelector<HTMLInputElement>('[data-health-face]')!,second=controls.querySelector<HTMLInputElement>('[data-command-face2]')!;
          first.required=!!count && !virtual;first.disabled=!count || virtual;second.required=count===2 && !virtual;second.disabled=count!==2 || virtual;controls.querySelector<HTMLElement>('[data-command-face2-label]')!.hidden=second.disabled;
          controls.querySelector<HTMLOutputElement>('[data-command-preview]')!.textContent=count?`Somente o bônus de ${command.ally}: ${count}d${command.die}, do tipo de dano do ataque. Dado já pago; nenhum novo gasto.`:outcome.value?'Encerrar sem rolar dano adicional. O dado continua gasto.':'Escolha o resultado; não role outro ataque.';
        };
        controls.addEventListener('change',update);update();
        if(!await host.confirmDestructiveAction('Golpe do Comandante · resultado','O ataque do aliado é resolvido na mesa. Aqui você registra o dado adicional desse ataque ou encerra a ordem.','Registrar resultado',controls))return;
        if(!valid())throw new Error('A ficha, a conta, o dado ou a ordem mudou. O resultado não foi registrado; o gasto anterior permanece.');
        choice=readChoice();const plan=previewCommandResult(c,choice),virtual=source.value==='virtual';
        if(plan.count){
          if(virtual && !host.ruleDiceSettings().enabled)throw new Error('Dados virtuais desligados; registre as faces físicas. A ordem paga permanece.');
          if(virtual){const result=host.rollWeaponFormula(plan.formula,`Golpe do Comandante · bônus para ${command.ally}`);faces=result.groups.flatMap((g:{faces:number[]})=>g.faces);}
          else faces=[Number(controls.querySelector<HTMLInputElement>('[data-health-face]')!.value),...(plan.count===2?[Number(controls.querySelector<HTMLInputElement>('[data-command-face2]')!.value)]:[])];
        }
      }else if(action!=='end')return;
      const result=finishCommandResult(c,choice,faces),text=result.count?`${command.ally}: +${result.total} ao dano (${result.formula}[${faces.join('+')}]), do tipo do ataque. Inclua só uma vez; dado já pago.`:choice.outcome==='miss'?`${command.ally} errou: sem dano adicional; o dado continua gasto.`:`Ordem para ${command.ally} encerrada na mesa, sem rolar outro dado; o gasto anterior permanece.`;
      save(`Golpe do Comandante · ${text}`);
      for(const output of document.querySelectorAll<HTMLOutputElement>(`[data-command-result="${command.source}"]`)){output.hidden=false;output.textContent=text;}
      host.showToast(text);
    }catch(error){host.showToast((error as Error).message);}
    finally{pending.delete(c);}
  });
}
