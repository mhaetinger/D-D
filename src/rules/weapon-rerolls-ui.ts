import {escape,type Engine, type Sheet} from './model';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';
import {type DiceResult} from './dice-roll';
import {type WeaponDamagePlan} from './weapon-damage';
import {beginWeaponReroll,chooseWeaponSet,greatWeaponDice,rerollGreatWeapon,rerollSavageAttacker,weaponRerollOptions,weaponRerollResult,type WeaponReroll} from './weapon-rerolls';

interface Pending {
  c:Sheet;entry:Sheet;plan:WeaponDamagePlan;roll:WeaponReroll;snapshot:string;
  sequence:number;workspace:string;busy:boolean;
}
const pending=new WeakMap<Sheet,Pending>();
const host=()=>window as any;
const tip=(name:string,text:string)=>`tabindex="0" data-rule-tooltip="${escape(JSON.stringify({name,text}))}"`;
function valid(p:Pending) {
  return pending.get(p.c)===p && currentWorkspaceKey()===p.workspace && host().getChar()===p.c && p.c.weapons?.includes(p.entry) &&
    JSON.stringify(p.c)===p.snapshot && canEditSheet(p.c) && host().ruleDiceSettings().automatic &&
    host().ruleDiceSettings().sequence===p.sequence;
}
function requireCurrent(p:Pending) {
  if(!valid(p)){pending.delete(p.c);throw new Error('A ficha ou a jogada mudou. A repetição antiga não foi aplicada; os gastos já registrados permanecem.');}
}
/** Sessão transitória: fechar e retomar conserva faces e repetições, sem lançar
 * ou cobrar novamente. Recarga perde essa escolha, nunca devolve um espaço já
 * gasto. Os resultados constam do histórico local, não de uma nova reserva. */
async function show(p:Pending) {
  if(p.busy)return;
  p.busy=true;
  const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
  const {savage,greatWeapon}=p.roll.options;
  controls.innerHTML=`<output data-weapon-reroll-total role="status" aria-live="polite"></output>
    ${[0,1].map(i=>`<div data-weapon-set="${i}" class="t-inset rounded p-2" ${i?'hidden':''}>
      <label class="rule-check"><input type="radio" name="weaponDamageSet" data-weapon-set-choice="${i}"><span data-weapon-set-label></span></label>
      <div class="flex flex-wrap gap-2 mt-2" ${greatWeapon?'':'hidden'}>${Array.from({length:p.roll.count},(_,n)=>`<button type="button" data-weapon-repeat-die="${i}:${n}" class="t-btn px-2 py-1 rounded"></button>`).join('')}</div>
    </div>`).join('')}
    ${greatWeapon?`<span class="t-text-muted" ${tip('Combate com Armas Grandes','Clique nos dados 1 ou 2 que deseja repetir. Cada dado aceita uma repetição pelo estilo; a nova face vale mesmo se for 1 ou 2. A arma deve ser elegível e empunhada com duas mãos. Adicionais de outras características não são repetidos.')}>↻ Repetir 1/2 · nova face obrigatória ⓘ</span>`:''}
    ${savage?`<label class="rule-check" ${tip('Atacante Bestial','Uma vez por turno, repete todos os dados da arma e permite escolher um dos conjuntos completos. Não combina a melhor face de cada conjunto. Confirme com a mesa que ainda não usou neste turno.')}><input type="checkbox" data-weapon-savage-available> Atacante Bestial disponível neste turno ⓘ</label><button type="button" data-weapon-savage-reroll class="t-btn px-2 py-1 rounded" disabled>Atacante Bestial · repetir arma</button>`:''}
    <p class="t-text-muted">Adicionais e bônus mantidos · gastos já registrados.${p.plan.sweeping?' Trespassante na outra criatura já registrado separadamente; aqui muda somente o dano do alvo original.':''}</p>`;
  const update=()=>{
    controls.querySelector<HTMLOutputElement>('[data-weapon-reroll-total]')!.textContent=`${p.plan.sweeping?'Dano do alvo original':'Dano total'}: ${weaponRerollResult(p.roll).total} · ${p.plan.formula}`;
    for(const [i,row] of [...controls.querySelectorAll<HTMLElement>('[data-weapon-set]')].entries()){
      const set=p.roll.sets[i];row.hidden=!set;if(!set)continue;
      const radio=row.querySelector<HTMLInputElement>('[data-weapon-set-choice]')!;radio.checked=p.roll.selected===i;
      row.querySelector<HTMLElement>('[data-weapon-set-label]')!.textContent=`${i?'Novo':'Inicial'}: ${set.faces.join(' + ')} = ${set.faces.reduce((a,b)=>a+b,0)}${radio.checked?' ✓':''}`;
      for(const [n,b] of [...row.querySelectorAll<HTMLButtonElement>('[data-weapon-repeat-die]')].entries()){
        b.textContent=`d${p.roll.sides} · ${set.faces[n]}${set.repeated.includes(n)?' ✓':greatWeaponDice(p.roll,i).includes(n)?' ↻':''}`;
        b.disabled=p.roll.selected!==i || !greatWeaponDice(p.roll,i).includes(n);
        b.setAttribute('aria-label',`Conjunto ${i+1}, dado ${n+1}, face ${set.faces[n]}${set.repeated.includes(n)?', repetição do estilo já usada':''}`);
      }
    }
    const available=controls.querySelector<HTMLInputElement>('[data-weapon-savage-available]');
    if(available){available.disabled=p.roll.sets.length>1;controls.querySelector<HTMLButtonElement>('[data-weapon-savage-reroll]')!.disabled=!available.checked || available.disabled;}
  };
  const apply=(next:WeaponReroll,description:string)=>{
    p.roll=next;const result=weaponRerollResult(next);
    host().presentRuleDiceResult(result,`Dano: ${p.plan.name}`);
    p.sequence=host().ruleDiceSettings().sequence;
    // Preserva nós/foco do diálogo; não há novo desconto de Destruição.
    host().recordStepAndSave(`${description} · ${p.plan.name} · ${result.breakdown.join(' · ')} · total ${result.total}`,true,false);
    p.snapshot=JSON.stringify(p.c);update();
  };
  controls.addEventListener('change',event=>{
    try{
      requireCurrent(p);
      const target=event.target as HTMLInputElement;
      if(target.matches('[data-weapon-set-choice]'))apply(chooseWeaponSet(p.roll,Number(target.dataset.weaponSetChoice)),'Escolheu conjunto de Atacante Bestial');
      else update();
    }catch(error){host().showToast((error as Error).message);}
  });
  controls.addEventListener('click',event=>{
    const target=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!target || target.disabled)return;
    try{
      requireCurrent(p);
      if(target.matches('[data-weapon-repeat-die]')){
        const [set,index]=target.dataset.weaponRepeatDie!.split(':').map(Number);
        if(set!==p.roll.selected)throw new Error('Escolha o conjunto antes de repetir um dado.');
        apply(rerollGreatWeapon(p.roll,[index]),'Combate com Armas Grandes');
      }else if(target.matches('[data-weapon-savage-reroll]'))apply(rerollSavageAttacker(p.roll,controls.querySelector<HTMLInputElement>('[data-weapon-savage-available]')!.checked),'Atacante Bestial · uso deste turno confirmado pela mesa');
    }catch(error){host().showToast((error as Error).message);}
  });
  update();
  try{
    const finished=await host().confirmDestructiveAction('Dados da arma · '+p.plan.name,'Escolha as repetições opcionais. Retomar conserva os mesmos dados e gastos nesta sessão.','Concluir dano',controls,{cancelLabel:'Retomar depois'});
    if(finished){requireCurrent(p);pending.delete(p.c);host().showToast(`Dano · ${weaponRerollResult(p.roll).total} · ${p.plan.name}`);}
  }catch(error){host().showToast((error as Error).message);}
  finally{p.busy=false;}
}
export function resumeWeaponReroll(c:Sheet,entry:Sheet) {
  const p=pending.get(c);if(!p || p.entry!==entry)return false;
  if(!valid(p)){pending.delete(c);return false;}
  void show(p);return true;
}
export function offerWeaponRerolls(c:Sheet,entry:Sheet,plan:WeaponDamagePlan,result:DiceResult,E:Engine) {
  const options=weaponRerollOptions(c,entry,E);if(!options.savage && !options.greatWeapon)return;
  const p:Pending={c,entry,plan,roll:beginWeaponReroll(plan,result,options),snapshot:JSON.stringify(c),sequence:host().ruleDiceSettings().sequence,workspace:currentWorkspaceKey(),busy:false};
  if(!options.savage && !greatWeaponDice(p.roll).length)return;
  pending.set(c,p);void show(p);
}
