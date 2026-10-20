import { concentration, concentrationBlock, concentrationInvalid, endConcentration, focusedConjuration, resolveConcentration, startConcentration } from './concentration';
import { concentrationSaveDetails } from './combat';
import { consumeInspiration } from './health';
import { active, escape, type Engine, type Sheet } from './model';
import { chooseDieSource, dieSourceControls } from './health-ui';

const button=(action:string,text:string,disabled=false)=>`<button type="button" data-concentration-action="${action}" ${disabled?'disabled':''}>${text}</button>`;
export function concentrationControls(c:Sheet) {
  const current=concentration(c),invalid=concentrationInvalid(c),first=current?.checks[0],blocked=concentrationBlock(c);
  const help=escape(JSON.stringify({name:'Concentração · 2014',text:'Acompanhe um efeito que seu personagem mantém por concentração e os testes para não perdê-lo ao sofrer dano. É o mesmo registro nas abas de combate e grimório; preparar magias não o ativa. Somente um efeito por vez. Conjurar outra magia de concentração encerra a anterior; um ritual ou outra conjuração prolongada também exige concentração enquanto é realizada. Cada fonte de dano pede uma resistência de CON, CD 10 ou metade do dano, o maior. Fúria, incapacitação e morte encerram. Duração e efeitos nos alvos ficam a cargo da mesa.'}));
  return `<details class="rule-context rule-concentration" data-rule-disclosure="concentration" data-concentration-control data-concentration-count="${current?.checks.length || 0}" ${first?'open':''}>
  <summary data-rule-tooltip="${help}">Concentração · ${invalid?'registro ilegível preservado':current?escape(current.name):'nenhuma ativa'}${current?.checks.length?` · ${current.checks.length} teste(s) pendente(s)`:''}</summary>
  ${invalid?'<p>Baixe um backup e confira os dados deste registro. Os originais foram preservados.</p>':current?`<div class="rule-controls">${button('end','Encerrar')}${button('environment','Teste por ambiente',!!first || !!blocked)}${button('manual','Registrar outro efeito',!!blocked)}</div>${current.duration?`<p>Duração: ${escape(current.duration)} · tempo da mesa.</p>`:''}${focusedConjuration(c)?'<p>Conjuração Focada: dano não quebra esta concentração; incapacitação ainda encerra.</p>':''}${first?`<div class="rule-controls"><span>${first.damage} de dano${first.shape?' · na forma de besta':''}</span>${button('check',`Teste de CON · CD ${first.dc}`,!!blocked)}</div>`:''}`:button('manual','Registrar efeito da mesa',!!blocked)}
  </details>`;
}
export function setupConcentrationUI(E:Engine,save:(description:string)=>void) {
  const host=window as any;
  document.addEventListener('click',async event=>{
    const trigger=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-concentration-action]');if(!trigger || trigger.disabled)return;
    const c=host.getChar();if(!c)return;
    const action=trigger.dataset.concentrationAction,current=concentration(c);
    try {
      if(action==='end') {const old=endConcentration(c);if(old)save('Encerrou concentração · '+old.name);return;}
      if(action==='manual') {
        const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
        controls.innerHTML='<label>Efeito <input type="text" maxlength="120" required data-concentration-name></label><label>Duração <input type="text" maxlength="200" data-concentration-duration placeholder="Tempo da mesa"></label>';
        if(!await host.confirmDestructiveAction('Registrar concentração da mesa',`Use para um efeito já resolvido fora dos controles de conjuração. Não gasta espaços nem usos; confira esses recursos na ficha.${current?' Substitui '+current.name+'.':''}`,'Registrar efeito',controls))return;
        if(host.getChar()!==c || concentration(c)?.id!==current?.id)return;
        const result=startConcentration(c,{name:controls.querySelector<HTMLInputElement>('[data-concentration-name]')!.value,duration:controls.querySelector<HTMLInputElement>('[data-concentration-duration]')!.value});
        save('Registrou concentração da mesa · '+result.name);return;
      }
      if(!current || !['check','environment'].includes(action || ''))return;
      const check=action==='check'?current.checks[0]:null;if(action==='check' && !check)return;
      const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
      const shape=check?check.shape:active(c,'druida:wildShape');
      controls.innerHTML=`${dieSourceControls(20)}${!check?'<label>CD indicada pela mesa <input type="number" min="1" max="1000" value="10" required data-concentration-dc></label>':''}${shape?'<label title="Informe o total adequado à forma que recebeu o dano, incluindo proficiências e efeitos. Não é somado ao bônus humano.">Bônus total de CON da forma <input type="number" min="-100" max="100" step="1" required data-concentration-shape></label>':''}<label>Outros bônus recebidos <input type="number" min="-100" max="100" step="1" value="0" data-concentration-extra></label><label>Modo da mesa <select data-concentration-mode><option value="normal">Normal</option><option value="adv">Vantagem</option><option value="dis">Desvantagem</option></select></label><p data-concentration-preview></p><p>1/20 natural não decide sozinho: compare o total com a CD.</p>`;
      chooseDieSource(controls);
      const mode=controls.querySelector<HTMLSelectElement>('[data-concentration-mode]')!;mode.value=host.ruleDiceSettings().mode;
      const details=()=>{
        const field=controls.querySelector<HTMLInputElement>('[data-concentration-shape]');
        if(field && !field.value.trim())throw new Error('Informe o bônus de CON da forma que recebeu o dano.');
        return concentrationSaveDetails(c,E,{mode:mode.value as 'normal'|'adv'|'dis',damage:!!check,extra:Number(controls.querySelector<HTMLInputElement>('[data-concentration-extra]')!.value),...(field?{shapeBonus:Number(field.value)}:{})});
      };
      const preview=()=>{
        const target=controls.querySelector<HTMLElement>('[data-concentration-preview]')!;
        try {const d=details();target.textContent=`CON ${d.bonus>=0?'+':''}${d.bonus} · ${d.mode==='adv'?'vantagem':d.mode==='dis'?'desvantagem':'normal'}${d.warcaster?' · Conjurador de Guerra':''}${d.exhausted?' · Exaustão':''}${d.inspired?' · Inspiração preparada':''}`;}catch(e){target.textContent=(e as Error).message;}
      };
      controls.addEventListener('input',preview);controls.addEventListener('change',preview);preview();
      if(!await host.confirmDestructiveAction('Manter concentração?',check?`${current.name} · ${check.damage} de dano · CD ${check.dc}. No dado físico, registre a face escolhida no modo indicado.`:`${current.name} · teste por risco ambiental indicado pela mesa.`,'Registrar teste',controls))return;
      if(host.getChar()!==c || concentration(c)?.id!==current.id)return;
      const d=details(),virtual=controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual',face=Number(controls.querySelector<HTMLInputElement>('[data-health-face]')!.value),dc=check?.dc ?? Number(controls.querySelector<HTMLInputElement>('[data-concentration-dc]')!.value);
      resolveConcentration(structuredClone(c),current.id,check?.id || null,virtual?10:face,d.bonus,dc);
      const natural=virtual?host.rollRuleDie(20,'Concentração · '+current.name,d.mode):face;
      const result=resolveConcentration(c,current.id,check?.id || null,natural,d.bonus,dc),inspired=consumeInspiration(c);
      save(`Concentração · ${result.name}: d20 ${natural}, CON ${d.bonus}, total ${result.total}/CD ${result.dc} · ${result.success?'manteve':'encerrou'}${inspired?' · usou inspiração':''}`);
      host.showToast(`${result.success?'Manteve':'Encerrou'} concentração · ${result.total}/CD ${result.dc}.`);
    }catch(error){host.showToast(error instanceof Error?error.message:'Não foi possível registrar a concentração.');}
  });
}
