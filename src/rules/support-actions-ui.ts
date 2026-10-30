import {escape,norm,type Engine,type Sheet} from './model';
import {hasFeat} from './passives';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';
import {chooseResourceDice} from './resource-roll-ui';
import {chooseDieSource,dieSourceControls} from './health-ui';
import {receivedBardic,invalidBardic,endReceivedBardic} from './bardic-received';
import {healerKit,kitBalance,previewHealer,applyHealer,bardSource,giveBardic,previewCutting,applyCutting,previewReceiveBardic,receiveBardic,previewBardicUse,useReceivedBardic,type HealerChoice,type CuttingChoice,type BardicUse} from './support-actions';

const tip=(name:string,text:string)=>`data-rule-tooltip="${escape(JSON.stringify({name,text}))}"`;
const button=(c:Sheet,id:string,label:string,text:string,disabled=false)=>`<button type="button" data-support-action="${id}" ${!canEditSheet(c)||disabled?'disabled':''} ${tip(label,text)}>${label}</button>`;
export function bardGivingControls(c:Sheet,E:Engine) {
  let unavailable=false;try{bardSource(c,E);}catch{unavailable=true;}
  return button(c,'give','Conceder dado','Ação bônus no seu turno: outra criatura até 18 m que possa ouvir você e ainda não tenha dado de Inspiração de Bardo. Gasta um uso da reserva acima, sem rolar. O destinatário registra o dado na própria ficha; dura 10 minutos de jogo.',unavailable);
}
export function supportFeatureControls(c:Sheet,g:Sheet,E:Engine) {
  const name=norm(g.name);
  if(name==='curandeiro' && hasFeat(c,E,'Curandeiro'))return `<div class="rule-controls">${button(c,'heal','Tratar ferimentos','Ação e um uso do kit: 1d6 + 4 + número máximo de Dados de Vida do destinatário. Só pode receber outro tratamento após descanso curto/longo, mesmo de outro Curandeiro. Confirme o saldo de kits importados.')}${button(c,'stabilize','Estabilizar · 1 PV','Quando seu kit estabiliza uma criatura viva morrendo a 0 PV, Curandeiro faz ela recuperar 1 PV. Gasta um uso, sem rolar d6; não é o tratamento de ferimentos.')}</div>`;
  if(name==='palavras de interrupcao'){
    let unavailable=false;try{bardSource(c,E,true);}catch{unavailable=true;}
    return `<div class="rule-controls">${button(c,'cutting','Interromper · reação','Criatura visível até 18 m que ouve você e não é imune a encantamento. Após rolar, antes de saber sucesso/falha ou antes de causar dano, gaste sua Inspiração de Bardo e subtraia o dado de ataque, teste de habilidade ou dano. Não afeta resistência; não cancela crítico natural.',unavailable)}</div>`;
  }
  return '';
}
export function receivedBardicControls(c:Sheet) {
  const buff=receivedBardic(c);
  return `<div class="sheet-inspiration rule-context rule-controls" data-support-received><strong>Inspiração de Bardo recebida</strong>${invalidBardic(c)?'<span>Registro ilegível preservado · confira o backup</span>':buff?`<span>${escape(buff.source)} · d${buff.die}${buff.combat?' · Bravura':''}</span>${button(c,'received-use','Usar dado recebido','Some o dado a um teste, ataque ou resistência já rolado, antes de saber o resultado. Bravura também permite dano de arma ou reação na CA contra um ataque. O dado se perde ao rolar, mesmo sem mudar o resultado. Prazo de 10 minutos de jogo conferido na mesa.')}${button(c,'received-end','Encerrar','Encerre quando passar o prazo de 10 minutos de jogo ou perder o dado. Descansos também encerram um registro válido.')}`:button(c,'receive','Recebi um dado','Registre um dado concedido por outro bardo, sem gastar sua própria reserva. Não se acumula com outro dado de Inspiração de Bardo; não é a inspiração que concede vantagem no d20.')}<output data-support-result role="status" class="min-w-0 break-words basis-full" hidden></output></div>`;
}
export function kitUseSummary(item:Sheet) {
  if(!healerKit(item))return '';
  try{const p=kitBalance(item);return `<span>${p.value===undefined?'Usos a conferir':`${p.value}/${p.max} usos`}</span>`;}catch{return '<span>Usos a conferir · registro preservado</span>';}
}
const pending=new WeakSet<Sheet>();
/** Os nomes identificam participantes na mesa. Nenhuma ação busca ou modifica
 * outra ficha. A transação revalida documento, conta, permissão e dados antes
 * da primeira rolagem; gasto e efeito só entram juntos após a confirmação. */
export function setupSupportActionsUI(E:Engine,save:(description:string)=>void) {
  const host=window as any;
  document.addEventListener('click',async event=>{
    const trigger=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-support-action]');if(!trigger || trigger.disabled)return;
    const c=host.getChar();if(!c || pending.has(c))return;pending.add(c);
    try{
      const before=JSON.stringify(c),scope=currentWorkspaceKey(),settings=host.ruleDiceSettings();
      // A rolagem autorizada incrementa a sequência da animação. Até ela,
      // exigimos também a sequência original; depois, sem await intermediário,
      // conferimos documento e modos sem rejeitar a própria animação.
      const guard=(rolled=false)=>{const now=host.ruleDiceSettings();if(host.getChar()!==c || currentWorkspaceKey()!==scope || JSON.stringify(c)!==before || !trigger.isConnected || !canEditSheet(c) || now.enabled!==settings.enabled || now.automatic!==settings.automatic || now.mode!==settings.mode || !rolled && now.sequence!==settings.sequence)throw new Error('A ficha, conta, permissão ou configuração de dados mudou. Nenhum uso foi aplicado.');};guard();
      const fields=document.createElement('div');fields.className='rule-context rule-dialog-fields';
      const input=(key:string)=>fields.querySelector<HTMLInputElement>(`[data-support-${key}]`)!;
      const select=(key:string)=>fields.querySelector<HTMLSelectElement>(`[data-support-${key}]`)!;
      const declared=()=>input('declared').checked;
      const declaration=(text:string)=>`<label class="rule-check"><input type="checkbox" required data-support-declared> ${text}</label><output data-support-preview role="status"></output>`;
      const preview=(check:()=>string)=>{
        const anchor=fields.querySelector<HTMLInputElement|HTMLSelectElement>('input:not([type="checkbox"]),select')!;
        const update=()=>{anchor.setCustomValidity('');try{fields.querySelector('output')!.textContent=check();}catch(error){anchor.setCustomValidity((error as Error).message);fields.querySelector('output')!.textContent=(error as Error).message;}};
        fields.addEventListener('input',update);fields.addEventListener('change',update);update();
      };
      const id=trigger.dataset.supportAction;let text='';
      if(id==='heal' || id==='stabilize'){
        const kits=(c.inventoryItems||[]).map((item:Sheet,index:number)=>({item,index})).filter(({item}:{item:Sheet})=>healerKit(item));
        if(!kits.length)throw new Error('Adicione um Kit de primeiros-socorros ao inventário antes de usar Curandeiro.');
        fields.innerHTML=`<label>Kit no inventário <select required data-support-kit>${kits.map(({item,index}:{item:Sheet;index:number})=>`<option value="${index}">${escape(item.name)} · ${escape(item.qty)} unidade(s)</option>`).join('')}</select></label><label>Usos disponíveis agora <input type="number" required min="1" step="1" data-support-available></label><label>Destinatário <select data-support-self>${id==='heal'?'<option value="self">Você</option>':''}<option value="other">Outra criatura · aplicação na mesa</option></select></label><label data-support-target-label>Nome da criatura <input required maxlength="80" data-support-target></label><label data-support-hd-label>Número máximo de Dados de Vida da criatura <input type="number" required min="1" max="1000" step="1" data-support-hd></label><label class="rule-check"><input type="checkbox" required data-support-eligible> ${id==='heal'?'Não recebeu tratamento de Curandeiro desde o último descanso curto/longo, ou nunca recebeu':'A mesa conferiu tratamentos e descansos anteriores e confirmou que a criatura pode receber o 1 PV do talento'}</label>${declaration(id==='heal'?'Tenho uma ação e acesso à criatura e ao kit':'Tenho a ação aplicável e acesso ao kit; a criatura está viva, morrendo a 0 PV e será estabilizada pelo kit')}`;
        const fillKit=()=>{try{const p=kitBalance(c.inventoryItems[Number(select('kit').value)]);input('available').max=String(p.max);input('available').value=p.value===undefined?'':String(p.value);}catch{input('available').value='';}};
        const updateRecipient=()=>{const self=select('self').value==='self';input('target').disabled=self;fields.querySelector<HTMLElement>('[data-support-target-label]')!.hidden=self;input('hd').disabled=self || id==='stabilize';fields.querySelector<HTMLElement>('[data-support-hd-label]')!.hidden=self || id==='stabilize';};
        select('kit').addEventListener('change',fillKit);select('self').addEventListener('change',updateRecipient);fillKit();updateRecipient();
        const read=(face=1):HealerChoice=>({kit:Number(select('kit').value),available:Number(input('available').value),self:select('self').value==='self',target:select('self').value==='self'?'você':input('target').value,hitDice:Number(input('hd').value),declared:declared(),eligible:input('eligible').checked,mode:id==='heal'?'heal':'stabilize',face});
        preview(()=>{const p=previewHealer(c,{...read(),declared:true,eligible:true},E);return `Kit: ${p.available} → ${p.remaining} usos. ${id==='heal'?`Cura: 1d6 + 4 + ${p.hitDice} Dados de Vida máximos.`:'Estabiliza e recupera 1 PV.'} ${p.self?'Aplica aos seus PV, até o máximo.':'O destinatário aplica na própria ficha.'}`;});
        let face=0;
        if(id==='heal'){
          const faces=await chooseResourceDice(c,'Curandeiro · tratar ferimentos',6,1,{fields,valid:()=>{guard();previewHealer(c,read(),E);return true;},message:'Gasta um uso do kit. Confirme o saldo atual; 10 usos por kit novo. O bônus usa os Dados de Vida máximos do destinatário, sem gastar Dados de Vida.',acceptLabel:'Tratar e gastar 1 uso'});if(!faces)return;face=faces[0];
        }else if(!await host.confirmDestructiveAction('Curandeiro · estabilizar','Não rola d6. Confira na mesa o limite de nova cura do talento após tratamentos anteriores. Gasta um uso do kit; o destinatário registra 1 PV na própria ficha. Ações especiais, como Mãos Rápidas com o kit, são conferidas na mesa.','Estabilizar e gastar 1 uso',fields))return;
        guard(id==='heal');const p=applyHealer(c,read(face),E);text=`Curandeiro · ${id==='heal'?`d6 ${face} + 4 + ${p.hitDice} DV = ${p.healing} de cura`:'estabilização e 1 PV'} para ${p.target}. Kit: ${p.remaining} usos restantes. ${p.self?`Recuperou ${p.restored} PV até seu máximo.`:'Aplicar na mesa; outra ficha não foi alterada.'}`;
      }else if(id==='give'){
        const p=bardSource(c,E);
        fields.innerHTML=`<label>Outra criatura <input required maxlength="80" data-support-target></label>${declaration('Tenho ação bônus no meu turno; outra criatura até 18 m pode me ouvir e ainda não tem dado de Inspiração de Bardo')}`;
        if(!await host.confirmDestructiveAction('Conceder Inspiração de Bardo',`Concede d${p.die}${p.combat?' com Inspiração em Combate (Bravura)':''} por até 10 minutos de jogo. Gasta um uso da reserva; não rola o dado agora. O destinatário registra na própria ficha. Não clique também em Usar na mesa.`,`Conceder d${p.die}`,fields))return;
        guard();const result=giveBardic(c,input('target').value,declared(),E);text=`Concedeu d${result.die} de Inspiração de Bardo${result.combat?' · Bravura':''} a ${result.target}; 1 uso gasto. Prazo: 10 minutos de jogo. Destinatário registra na própria ficha.`;
      }else if(id==='cutting'){
        const p=bardSource(c,E,true);
        fields.innerHTML=`<label>Criatura <input required maxlength="80" data-support-target></label><label>Jogada que será reduzida <select data-support-kind><option value="attack">Ataque</option><option value="check">Teste de habilidade</option><option value="damage">Dano rolado · inclusive mágico</option></select></label><label>Total já rolado <input type="number" required min="-1000000" max="1000000" step="1" data-support-total></label>${declaration('Tenho reação; vejo a criatura até 18 m, ela me ouve e não é imune a encantamento; ainda não foi informado sucesso/falha ou causado o dano')}`;
        const read=(face=1):CuttingChoice=>({target:input('target').value,kind:select('kind').value as CuttingChoice['kind'],total:Number(input('total').value),declared:declared(),face});
        preview(()=>{previewCutting(c,{...read(),declared:true},E);return `Subtrai 1d${p.die} deste total. Dano não fica negativo; crítico natural não é cancelado. Gasta a mesma reserva de Inspiração de Bardo.`;});
        const faces=await chooseResourceDice(c,'Palavras de Interrupção',p.die,1,{fields,valid:()=>{guard();previewCutting(c,read(),E);return true;}});if(!faces)return;
        guard(true);const result=applyCutting(c,read(faces[0]),E);text=`Palavras de Interrupção · ${result.target}: ${result.total} − d${result.die} (${result.face}) = ${result.after}. ${result.kind==='attack'?'Crítico natural continua acertando. ':''}1 uso de Inspiração gasto; reação declarada. Resolva na mesa.`;
      }else if(id==='receive'){
        fields.innerHTML=`<label>Nome do bardo que concedeu <input required maxlength="80" data-support-source></label><label>Dado recebido <select data-support-die>${[6,8,10,12].map(n=>`<option value="${n}">d${n}</option>`).join('')}</select></label><label class="rule-check"><input type="checkbox" data-support-combat> Concedido por bardo da Bravura de nível 3+ · Inspiração em Combate</label>${declaration('Recebi de outro bardo até 18 m e pude ouvi-lo; não tinha outro dado; ainda não se passaram 10 minutos de jogo')}`;
        const read=()=>({source:input('source').value,die:Number(select('die').value),combat:input('combat').checked});
        preview(()=>{previewReceiveBardic(c,read(),true);return 'Um único dado recebido. Não concede vantagem nem gasta sua própria reserva. O prazo é conferido na mesa.';});
        if(!await host.confirmDestructiveAction('Inspiração de Bardo recebida','Escolha o dado informado pelo bardo: níveis 1–4 d6, 5–9 d8, 10–14 d10, 15+ d12. O nível é o de bardo da origem.','Registrar dado recebido',fields))return;
        guard();const result=receiveBardic(c,read(),declared());text=`Recebeu d${result.die} de ${result.source}${result.combat?' · Bravura':''}. Disponível por até 10 minutos de jogo; um uso.`;
      }else if(id==='received-end'){
        if(!receivedBardic(c))throw new Error('Não há dado recebido legível para encerrar.');
        if(!await host.confirmDestructiveAction('Encerrar dado recebido','Encerra o dado de Inspiração de Bardo recebido; não recupera o uso do bardo que o concedeu.','Encerrar dado'))return;
        guard();endReceivedBardic(c);text='Encerrou a Inspiração de Bardo recebida.';
      }else if(id==='received-use'){
        const buff=receivedBardic(c);if(!buff)throw new Error('Não há dado recebido legível.');
        fields.innerHTML=`<label>Somar o dado a <select data-support-kind><option value="check">Teste de habilidade</option><option value="attack">Ataque</option><option value="save">Resistência</option>${buff.combat?'<option value="weaponDamage">Dano de arma · Bravura</option><option value="ac">CA contra um ataque · reação</option>':''}</select></label><label>Total já rolado, ou sua CA neste ataque <input type="number" required min="-1000000" max="1000000" step="1" data-support-total></label><label class="rule-check" data-support-critical-label hidden><input type="checkbox" data-support-critical> Este dano de arma é crítico · rolar dois dados</label>${dieSourceControls(buff.die,false)}<label data-support-second-label hidden>Segundo d${buff.die} do crítico <input type="number" min="1" max="${buff.die}" step="1" data-support-second></label>${declaration('O dado ainda está no prazo de 10 minutos de jogo; estou usando antes da resolução. Para CA, tenho reação e ainda não sei se o ataque acertou')}`;
        chooseDieSource(fields);
        const read=():BardicUse=>({kind:select('kind').value as BardicUse['kind'],total:Number(input('total').value),critical:input('critical').checked,declared:declared()});
        const update=()=>{const damage=select('kind').value==='weaponDamage',second=damage && input('critical').checked && fields.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='physical';fields.querySelector<HTMLElement>('[data-support-critical-label]')!.hidden=!damage;fields.querySelector<HTMLElement>('[data-support-second-label]')!.hidden=!second;input('second').disabled=!second;input('second').required=second;};
        fields.addEventListener('change',update);update();
        const count=()=>read().kind==='weaponDamage' && read().critical?2:1;
        preview(()=>{previewBardicUse(c,{...read(),declared:true},Array(count()).fill(1));return `Soma ${count()}d${buff.die}; o dado recebido se perde ao rolar, mesmo sem mudar o resultado. ${read().kind==='ac'?'CA só neste ataque; crítico ainda acerta.':'D20 natural preservado; não rola outro d20.'}`;});
        if(!await host.confirmDestructiveAction('Usar Inspiração de Bardo recebida','Informe a jogada já rolada. O resultado é um cálculo para aplicar na mesa; CA permanente, dano e outras fichas não são alterados.','Rolar e consumir dado',fields))return;
        guard();previewBardicUse(c,read(),Array(count()).fill(1));
        const virtual=fields.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual';
        const physical=[Number(fields.querySelector<HTMLInputElement>('[data-health-face]')!.value),...(count()===2?[Number(input('second').value)]:[])];
        if(!virtual)previewBardicUse(c,read(),physical);
        if(virtual && !host.ruleDiceSettings().enabled)throw new Error('Dados virtuais desligados; informe as faces físicas.');
        const faces=virtual?Array.from({length:count()},()=>host.rollRuleDie(buff.die,'Inspiração de Bardo recebida','normal')):physical;
        const result=useReceivedBardic(c,read(),faces);text=`Inspiração recebida de ${buff.source} · ${result.total} + ${faces.join(' + ')} = ${result.after}. Dado consumido. ${result.kind==='ac'?'CA somente neste ataque; crítico ainda acerta.':'D20 natural preservado.'} Aplicar na mesa.`;
      }else return;
      save(text);for(const output of document.querySelectorAll<HTMLOutputElement>('[data-support-result]')){output.hidden=false;output.textContent=text;}host.showToast(text);
    }catch(error){host.showToast((error as Error).message);}finally{pending.delete(c);}
  });
}
