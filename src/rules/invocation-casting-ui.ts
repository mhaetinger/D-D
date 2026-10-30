import {escape,type Engine,type Sheet} from './model';
import {invocationDefinition,previewInvocationCast,validateInvocationChoice,applyInvocationCast,type InvocationChoice} from './invocation-casting';
import {chooseResourceDice} from './resource-roll-ui';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';

export function invocationCastControls(c:Sheet,name:string,E:Engine) {
 const definition=invocationDefinition(name);if(!definition)return '';
 let unavailable='',cost='';try{cost=previewInvocationCast(c,name,E).cost;}catch(error){unavailable=(error as Error).message;}
 const host=typeof window!=='undefined'?window as any:null;
 if(host?.ruleDiceSettings && host.ruleDiceSettings().enabled && !host.ruleDiceSettings().automatic)unavailable='Só Pool · use Auto Ficha ou OFF';
 const entry=E.spell(definition.spell),tip={name:'Conjurar por '+name,text:`${cost || unavailable}. ${definition.self?'Somente em você. ':''}${definition.materialFree?'Dispensa material; mantém os componentes verbais/somáticos da magia.':'Componentes da magia mantidos.'} Confirma os custos junto da concentração. Não clique também em Registrar uso.`,page:entry?.page,pdfPage:entry?.pdfPage};
 return `<div class="rule-controls"><button type="button" data-invocation-cast="${escape(name)}" ${unavailable || !canEditSheet(c)?'disabled':''} data-rule-tooltip="${escape(JSON.stringify(tip))}">Conjurar ${escape(entry?.name || definition.spell)}</button><span class="t-text-muted">${escape(unavailable || cost)}</span></div>`;
}
/** As invocações diárias já possuem controle na própria característica. */
export function invocationFeatureControls(c:Sheet,g:Sheet,E:Engine) {
 const d=invocationDefinition(g.name);return g.classId==='bruxo' && d && !d.pact?invocationCastControls(c,g.name,E):'';
}
const pending=new WeakSet<Sheet>();
export function setupInvocationCastingUI(E:Engine,save:(description:string)=>void) {
 const host=window as any;
 document.addEventListener('click',async event=>{
  const trigger=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-invocation-cast]');if(!trigger || trigger.disabled)return;
  const c=host.getChar();if(!c || pending.has(c))return;pending.add(c);
  try {
   if(!canEditSheet(c) || !trigger.isConnected)throw new Error('A edição desta ficha está bloqueada.');
   // Assim como Conjurar no grimório, Só Pool deixa o lançamento na mesa.
   if(host.ruleDiceSettings().enabled && !host.ruleDiceSettings().automatic)throw new Error('Só Pool: use Auto Ficha ou OFF para conjurar pela ficha.');
   const p=previewInvocationCast(c,trigger.dataset.invocationCast!,E),before=JSON.stringify(c),scope=currentWorkspaceKey(),settings=JSON.stringify(host.ruleDiceSettings());
   const guard=(afterRoll=false)=>{
    if(host.getChar()!==c || !canEditSheet(c) || currentWorkspaceKey()!==scope || !trigger.isConnected || JSON.stringify(c)!==before || !afterRoll && JSON.stringify(host.ruleDiceSettings())!==settings)throw new Error('A ficha, conta, permissão ou dado mudou. Nenhuma conjuração foi aplicada.');
   };
   const fields=document.createElement('div');fields.className='rule-context rule-dialog-fields';
   fields.innerHTML=`<p><strong>${escape(p.cost)}</strong>${p.definition.pact?'':' · '+p.castLevel+'º círculo'} · ${escape(p.entry.time)}</p><p>${p.definition.self?'Alvo: somente você. ':'Alcance: '+escape(p.entry.range)+'. '}Componentes: ${escape(p.components)}.</p>${p.save?`<p>Quando o efeito exigir resistência: ${escape(p.save)}.</p>`:''}<p>${escape(p.info.duration)}${p.replaces?' · Encerra sua concentração em '+escape(p.old!.name)+'.':''}</p>${p.definition.targetLimited?'<label>Criatura <input required maxlength="80" data-invocation-target></label><label class="rule-check"><input type="checkbox" required data-invocation-eligible> É celestial, corruptor ou elemental; não usei esta invocação nesta criatura desde meu último descanso longo</label>':''}${p.definition.spell==='vitalidade-falsa'?`<label>PV temporários · não se somam <select data-invocation-temporary><option value="replace" ${c.hpTemp===0?'selected':''}>Substituir pelos novos 1d4 + 4 · duração 1 hora</option><option value="keep" ${c.hpTemp>0?'selected':''}>Manter os ${Number(c.hpTemp)} atuais e sua origem</option></select></label>`:''}<label class="rule-check"><input type="checkbox" required data-invocation-declared> Conferi alvo, componentes e tempo/ação disponíveis${p.info.prolonged?'; a conjuração prolongada foi concluída na mesa':''}</label><details><summary>Descrição da magia no livro</summary><p class="whitespace-pre-line">${escape(p.entry.text)}</p></details><p>Efeitos, alvos, prazos e interrupções são resolvidos na mesa. Metamagia não é aplicada por este controle.${p.definition.targetLimited?' O limite é por criatura; não gasta o contador diário antigo.':''}${p.definition.spell==='falar-com-os-mortos'?' A magia falha se o cadáver já a recebeu nos últimos 10 dias; confira na mesa.':''}${p.definition.spell==='conjurar-elemental'?' Perder concentração não dissipa o elemental: ele pode ficar hostil pelo restante da duração.':''}</p>`;
   const input=(key:string)=>fields.querySelector<HTMLInputElement>(`[data-invocation-${key}]`)!;
   const read=(face?:number):InvocationChoice=>({declared:input('declared').checked,target:input('target')?.value,targetEligible:input('eligible')?.checked,face,temporary:fields.querySelector<HTMLSelectElement>('[data-invocation-temporary]')?.value as InvocationChoice['temporary']});
   let face:number|undefined;
   if(p.definition.spell==='vitalidade-falsa'){
    const decision=chooseResourceDice(c,'Vigor Abissal · Vitalidade Falsa',4,1,{fields,acceptLabel:'Conjurar e escolher reserva',message:'Sempre no 1º círculo: 1d4 + 4 PV temporários em você, sem espaço nem uso diário. Não cura e não soma reservas.',valid:()=>{guard();validateInvocationChoice(c,p.definition.name,read(1),E);return true;}});
    if(fields.isConnected){input('declared').focus({preventScroll:true});fields.closest('dialog')!.scrollTop=0;}
    const faces=await decision;if(!faces)return;face=faces[0];guard(true);
   }else{
    const decision=host.confirmDestructiveAction(p.definition.name+' · '+p.entry.name,'Confirme o lançamento; custos e concentração serão aplicados juntos.','Conjurar'+(p.replaces?' e substituir concentração':''),fields);
    if(fields.isConnected){input('target')?.focus({preventScroll:true});if(!input('target'))input('declared').focus({preventScroll:true});fields.closest('dialog')!.scrollTop=0;}
    if(!await decision)return;guard();
   }
   const r=applyInvocationCast(c,p.definition.name,read(face),E);
   const text=`${p.definition.name} · conjurou ${r.name} no ${r.castLevel}º círculo (${r.cost})${r.target?' · '+r.target:''}${r.temporary!==null?` · d4 ${face} + 4 = ${r.temporary} PV temporários; ${r.kept?'manteve a reserva anterior':'substituiu a reserva, sem somar'}`:''}. ${r.summary}${r.save?' · alvo: '+r.save+' quando exigido pelo efeito':''}`;
   save(text);host.showToast(text);
  }catch(error){host.showToast((error as Error).message);}finally{pending.delete(c);}
 });
}
