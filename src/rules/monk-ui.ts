import {escape,level,norm,type Engine,type Sheet} from './model';
import {weaponStats,savingThrow} from './combat';
import {diamondReserve,payDiamond,chiReserve,applyStunning,finishStillness,previewMonkReturn,payMonkReturn,type ReturnChoice} from './monk';
import {currentMonkReturn,endMonkReturn,holdMonkReturn} from './monk-state';
import {UNARMED,martialArtsAvailable} from './martial-arts';
import {dieSourceControls,chooseDieSource} from './health-ui';
import {chooseResourceDice} from './resource-roll-ui';
import {sheetRollDetails} from './roll-context';
import {consumeInspiration} from './health';
import {hasCondition} from './conditions';
import {canEditSheet} from '../sheet-edit/access';
import {canConfigureSheet} from '../sheet-edit/lock';
import {currentWorkspaceKey} from '../storage/account-scope';

const modes='<option value="normal">Normal</option><option value="adv">Vantagem</option><option value="dis">Desvantagem</option>';
const trigger=(id:string,label:string,disabled:boolean)=>`<button type="button" data-monk-action="${id}" ${disabled?'disabled':''}>${label}</button>`;
const eligibleAttacks=(c:Sheet,E:Engine)=>(c.weapons||[]).map((entry:Sheet,index:number)=>({entry,index,w:weaponStats(c,entry,E)})).filter(({w}:{w:Sheet})=>w.ruleWeapon && w.calculationMode!=='manual' && w.meleeAttack);
export function monkFeatureControls(c:Sheet,g:Sheet,E:Engine) {
  if(g.classId!=='monge')return '';const name=norm(g.name),locked=!canEditSheet(c);let controls='';
  if(name==='artes marciais' && level(c,'monge'))controls=trigger('unarmed','Cadastrar golpe desarmado',!canConfigureSheet(c) || c.weapons.some((w:Sheet)=>w.ruleWeapon===UNARMED.name))+'<small>Cadastre com o cadeado aberto; rolagens ficam em Armas e ataques. Artes Marciais: sem armadura/escudo e somente armas de monge empunhadas; ataque bônus e mãos conferidos na mesa.</small>';
  if(name==='ataque atordoante' && level(c,'monge')>=5){let empty=false;try{chiReserve(c,E);}catch{empty=true;}controls=trigger('stun','Atordoar após acerto · 1 Chi',locked || empty)+'<small>CON contra CD de Chi; no fracasso, atordoado até o fim do seu próximo turno. Não impõe limite de uma tentativa por turno.</small>';}
  if(name==='mente tranquila' && level(c,'monge')>=7)controls=trigger('stillness','Encerrar encanto ou medo · ação',locked || !['enfeiticado','amedrontado'].some(id=>hasCondition(c,id)));
  if(name==='alma de diamante' && level(c,'monge')>=14)controls=trigger('diamond','Refazer resistência · 1 Chi',locked)+'<small>Proficiência já incluída, inclusive contra a morte. A repetição usa a nova jogada; concentração/morte oferecem a escolha antes de registrar uma falha.</small>';
  if(name==='defletir projeteis' && level(c,'monge')>=3){const pending=currentMonkReturn(c);controls='<small>Redução e apanhar: Dano detalhado → Calcular por tipo → Defesas do monge. Devolver só na mesma reação, após apanhar.</small>'+trigger('return','Devolver projétil apanhado · 1 Chi',locked || !!pending)+(pending?`<span class="basis-full min-w-0 break-words">${escape(pending.name)} · ataque já pago${pending.critical?' · crítico':''}</span>${trigger('return-damage','Registrar acerto ou erro da devolução',locked)}${trigger('return-end','Já resolvido na mesa / encerrar',locked)}`:'');}
  return controls?`<div class="rule-controls" data-monk-feature="${escape(name)}">${controls}<output data-monk-result role="status" class="basis-full min-w-0 break-words" hidden></output></div>`:'';
}
function source(controls:HTMLElement) {return controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual';}
function face(controls:HTMLElement) {return Number(controls.querySelector<HTMLInputElement>('[data-health-face]')!.value);}
function validateD20(controls:HTMLElement) {if(source(controls) && !(window as any).ruleDiceSettings().enabled)throw new Error('Dados virtuais desligados; informe a face física antes de gastar Chi.');if(!source(controls) && (!Number.isInteger(face(controls)) || face(controls)<1 || face(controls)>20))throw new Error('Informe a face final do d20, de 1 a 20.');}
function payBeforeRoll(c:Sheet,E:Engine,label:string,declared=true) {payDiamond(c,declared,E);(window as any).recordStepAndSave(`Alma de Diamante · gastou 1 Chi antes de repetir ${label}`,true,false);}
/** A falha original ainda não foi aplicada. Cancelar mantém a jogada original;
 * aceitar paga primeiro e usa obrigatoriamente a nova, sem uma terceira chance
 * oferecida por esta mesma falha. Nem concentração nem morte são aplicadas duas vezes. */
export async function offerDiamondReroll(c:Sheet,E:Engine,options:{natural:number;bonus:number;dc:number;mode:string;label:string;death?:boolean;valid:()=>boolean}) {
  if(options.natural===20 && options.death || options.natural+options.bonus>=options.dc && !(options.death && options.natural===1))return options.natural;
  try{diamondReserve(c,E);}catch{return options.natural;}
  const host=window as any,before=JSON.stringify(c),scope=currentWorkspaceKey(),settings=JSON.stringify(host.ruleDiceSettings());
  const guard=()=>{if(host.getChar()!==c || !canEditSheet(c) || currentWorkspaceKey()!==scope || JSON.stringify(c)!==before || JSON.stringify(host.ruleDiceSettings())!==settings || !options.valid())throw new Error('A ficha ou o teste mudou; a falha não foi registrada e nenhum Chi foi gasto.');};guard();
  const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';controls.innerHTML=dieSourceControls(20,false);chooseDieSource(controls);
  const accepted=await host.confirmDestructiveAction('Alma de Diamante · repetir a falha?',`${options.label}: d20 ${options.natural} + ${options.bonus} contra CD ${options.dc}. Gasta 1 Chi e deve usar a nova jogada, mesmo pior. Mantém os bônus e o modo ${options.mode==='adv'?'vantagem':options.mode==='dis'?'desvantagem':'normal'} da resistência original, sem gastar outra inspiração. Cancelar mantém o resultado original. Outros efeitos de escolha/repetição ficam na mesa.`,'Gastar 1 Chi e repetir',controls);
  guard();if(!accepted)return options.natural;
  diamondReserve(c,E);validateD20(controls);payBeforeRoll(c,E,options.label);
  return source(controls)?host.rollRuleDie(20,'Alma de Diamante · '+options.label,options.mode):face(controls);
}
const pending=new WeakSet<Sheet>();
export function setupMonkUI(E:Engine,save:(description:string)=>void) {
  const host=window as any;
  document.addEventListener('click',async event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-monk-action]');if(!button || button.disabled)return;
    const c=host.getChar();if(!c || pending.has(c))return;pending.add(c);
    try{
      const before=JSON.stringify(c),scope=currentWorkspaceKey(),settings=JSON.stringify(host.ruleDiceSettings());
      const guard=()=>{if(host.getChar()!==c || !canEditSheet(c) || currentWorkspaceKey()!==scope || JSON.stringify(c)!==before || !button.isConnected || JSON.stringify(host.ruleDiceSettings())!==settings)throw new Error('A ficha, conta, permissão ou jogada mudou. Nenhuma ação foi aplicada.');};guard();
      const controls=document.createElement('div');controls.className='rule-context rule-dialog-fields';
      const input=(key:string)=>controls.querySelector<HTMLInputElement>(`[data-monk-${key}]`)!;
      const select=(key:string)=>controls.querySelector<HTMLSelectElement>(`[data-monk-${key}]`)!;
      const declaration=(text:string)=>`<label class="rule-check"><input type="checkbox" required data-monk-declared> ${escape(text)}</label>`;
      const action=button.dataset.monkAction;let text='';
      if(action==='unarmed'){
        if(!canConfigureSheet(c) || c.weapons.some((w:Sheet)=>w.ruleWeapon===UNARMED.name))throw new Error('Abra o cadeado para cadastrar; não duplique o golpe desarmado.');
        const entry={name:UNARMED.name,ruleWeapon:UNARMED.name,bonus:'+0',damage:'1',calculationMode:'auto',notes:'Artes Marciais exige sem armadura/escudo e armas de monge; ação bônus e mãos conferidas na mesa.'};c.weapons.push(entry);text='Cadastrou golpe desarmado com cálculo pela ficha. Pode editá-lo no editor comum.';
      }else if(action==='stun'){
        controls.innerHTML=`<label>Acerto corpo a corpo <select required data-monk-weapon><option value="">Escolha o ataque…</option>${eligibleAttacks(c,E).map(({w,index}:{w:Sheet;index:number})=>`<option value="${index}">${escape(w.name)}</option>`).join('')}</select></label><label>Outra criatura atingida <input required maxlength="80" data-monk-target></label>${declaration('Acertei esta criatura corpo a corpo com arma ou golpe desarmado, e ainda não tentei Atordoante neste acerto')}`;
        if(!await host.confirmDestructiveAction('Ataque Atordoante · 2014','Gasta 1 Chi mesmo se o alvo passar ou for imune. Pode tentar em outros acertos, inclusive no mesmo turno. Não exige arma de monge, ausência de armadura ou dano positivo. Resistência e condição do alvo são resolvidas na mesa.','Gastar 1 Chi',controls))return;
        guard();if(!select('weapon').value)throw new Error('Escolha o ataque.');const p=applyStunning(c,Number(select('weapon').value),input('target').value,input('declared').checked,E);text=`Ataque Atordoante · ${p.weapon} acertou ${p.target} · gastou 1 Chi. Alvo testa CON CD ${p.dc}; se falhar, atordoado até o final do seu próximo turno. Aplicar na mesa.`;
      }else if(action==='stillness'){
        controls.innerHTML=`<label>Condição causada pelo efeito <select data-monk-condition>${[['enfeiticado','Enfeitiçado'],['amedrontado','Amedrontado']].filter(([id])=>hasCondition(c,id)).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label>${declaration('Posso usar minha ação para encerrar este efeito; as instruções do efeito não impedem essa ação')}<label class="rule-check"><input type="checkbox" data-monk-clear> Este é o último efeito causando essa condição · retirar a marca</label>`;
        if(!await host.confirmDestructiveAction('Mente Tranquila · um efeito','Encerra um efeito de encanto ou medo em você, sem Chi. Se outros efeitos ainda causam a condição, mantenha a marca. Uma magia que controle suas ações precisa ser conferida na mesa.','Encerrar um efeito',controls))return;
        guard();const p=finishStillness(c,select('condition').value,input('declared').checked,input('clear').checked);text=`Mente Tranquila · usou ação para encerrar um efeito de ${p.condition==='enfeiticado'?'encanto':'medo'} · ${p.cleared?'marca retirada':'marca mantida por outros efeitos'}. Sem gasto de Chi.`;
      }else if(action==='diamond'){
        diamondReserve(c,E);controls.innerHTML=`<label>Resistência que falhou <select data-monk-ability>${[['str','Força'],['dex','Destreza'],['con','Constituição'],['int','Inteligência'],['wis','Sabedoria'],['cha','Carisma']].map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label><label>CD do efeito <input type="number" min="1" max="1000" value="10" required data-monk-dc></label><label>Outros bônus do teste original <input type="number" min="-100" max="100" value="0" required data-monk-extra></label><label>Modo da jogada original <select data-monk-mode>${modes}</select></label>${dieSourceControls(20,false)}${declaration('Esta resistência falhou e ainda não apliquei suas consequências; vou usar obrigatoriamente a nova jogada')}`;
        chooseDieSource(controls);select('mode').value=host.ruleDiceSettings().mode;
        if(!await host.confirmDestructiveAction('Alma de Diamante · refazer resistência','A proficiência já está no bônus da ficha. Reaplique os mesmos bônus e modo do teste original, incluindo sua vantagem/desvantagem já cancelada. Não gasta outra inspiração. Concentração e morte têm sua escolha no próprio teste, antes de aplicar a falha.','Gastar 1 Chi e repetir',controls))return;
        guard();diamondReserve(c,E);validateD20(controls);const extra=Number(input('extra').value),dc=Number(input('dc').value),key=select('ability').value,mode=select('mode').value;
        if(!['str','dex','con','int','wis','cha'].includes(key) || !Number.isInteger(extra) || Math.abs(extra)>100 || !Number.isInteger(dc) || dc<1 || dc>1000 || !['normal','adv','dis'].includes(mode))throw new Error('Confira a resistência, bônus, modo e CD.');
        const bonus=savingThrow(c,key,E)+extra;payBeforeRoll(c,E,key,input('declared').checked);const natural=source(controls)?host.rollRuleDie(20,'Alma de Diamante',mode):face(controls),total=natural+bonus;
        text=`Alma de Diamante · 1 Chi já gasto · nova resistência ${key.toUpperCase()}: d20 ${natural} + ${bonus} = ${total}/CD ${dc}: ${total>=dc?'sucesso':'falha'}. Nova jogada obrigatória; 1/20 não decide sozinho. Resolva o efeito na mesa.`;
      }else if(action==='return'){
        chiReserve(c,E);if(currentMonkReturn(c))throw new Error('Resolva ou encerre a devolução já paga.');
        controls.innerHTML=`<label>Projétil apanhado <input required maxlength="80" data-monk-name></label><label>Dano normal próprio do projétil <select data-monk-base>${['1d4','1d6','1d8','1d10','1d12','2d6'].map(d=>`<option>${d}</option>`).join('')}</select></label><label>Tipo <select data-monk-type><option>perfurante</option><option>concussão</option><option>cortante</option></select></label><label class="rule-check"><input type="checkbox" data-monk-martial ${martialArtsAvailable(c)?'':'disabled'}> Usar dado de Artes Marciais no lugar do dado normal · sem armadura/escudo</label><label class="rule-check"><input type="checkbox" data-monk-strength> Arma de arremesso usando Força · munição usa Destreza</label><label>Bônus mágico do próprio projétil <input type="number" min="-10" max="10" value="0" required data-monk-magic></label><label>Modo informado pela mesa <select data-monk-mode>${modes}</select></label>${dieSourceControls(20,false)}${declaration('Defletir reduziu o dano a zero, apanhei o projétil com mão livre e tamanho adequado e faço uma única devolução na mesma reação, contra alvo no alcance 6/18 m; conferi os dados do projétil')}`;
        chooseDieSource(controls);select('mode').value=host.ruleDiceSettings().mode;
        const read=():ReturnChoice=>{const [count,die]=select('base').value.split('d').map(Number);return {name:input('name').value,die,count,type:select('type').value,strength:input('strength').checked,martial:input('martial').checked,magic:Number(input('magic').value),declared:input('declared').checked};};
        if(!await host.confirmDestructiveAction('Devolver projétil · mesma reação','Gasta 1 Chi antes de atacar, mesmo no erro. Ataque proficiente; projétil conta como arma de monge só neste ataque. Informe o dano da arma/munição apanhada, não o total de dano recebido; não copie o bônus de um arco para a flecha. Alcance longo impõe desvantagem, declarada no modo. Outros efeitos de escolha/repetição de d20 ficam na mesa.','Gastar 1 Chi e atacar',controls))return;
        guard();validateD20(controls);const p=previewMonkReturn(c,read(),E),mode=select('mode').value;if(!['normal','adv','dis'].includes(mode))throw new Error('Confira o modo.');
        const details=sheetRollDetails(c,{type:'attack',ability:p.key},mode as 'normal'|'adv'|'dis',E);payMonkReturn(c,read(),E);const inspired=consumeInspiration(c);host.recordStepAndSave(`Defletir · gastou 1 Chi antes de devolver ${p.name}${inspired?' · usou inspiração':''}`,true,false);
        const natural=source(controls)?host.rollRuleDie(20,'Devolver projétil',details.mode):face(controls),critical=natural>=p.criticalAt;
        if(natural!==1)holdMonkReturn(c,{name:p.name,die:p.die,count:p.count,modifier:p.modifier,type:p.type,critical});text=`Devolução de ${p.name} · d20 ${natural} + ${p.bonus} = ${natural+p.bonus}${critical?' · crítico':natural===1?' · 1 natural erra':''}. 1 Chi já gasto; ${details.mode==='adv'?'vantagem':details.mode==='dis'?'desvantagem':'normal'}. ${natural===1?'Errou: sem dano, o Chi continua gasto.':'Confirme acerto e registre o dano ou encerre.'}`;
      }else if(action==='return-damage' || action==='return-end'){
        const p=currentMonkReturn(c);if(!p)throw new Error('A devolução paga não está mais pendente; o gasto anterior permanece.');
        let total:number|null=null;
        if(action==='return-damage'){
          controls.innerHTML=declaration(`A devolução de ${p.name} acertou e este dano ainda não foi rolado/aplicado`);
          const faces=await chooseResourceDice(c,'Dano do projétil já pago',p.die,p.count*(p.critical?2:1),{fields:controls,valid:()=>{guard();return currentMonkReturn(c)===p && input('declared').checked;},message:`${p.critical?'Crítico: dados dobrados':'Acerto normal'}. Soma modificador ${p.modifier} uma vez, do tipo ${p.type}. Não gasta outro Chi. Se errou ou já resolveu, cancele e use Encerrar.`});if(!faces)return;
          total=Math.max(0,faces.reduce((n,x)=>n+x,0)+p.modifier);
        }
        endMonkReturn(c);text=`Devolução de ${p.name} · ${total===null?'encerrada/erro resolvido na mesa':`${total} ${p.type}${p.critical?' · crítico':''} para aplicar na mesa`}. Chi já pago, sem novo gasto.`;
      }else return;
      save(text);for(const output of document.querySelectorAll<HTMLOutputElement>('[data-monk-result]')){output.hidden=false;output.textContent=text;}host.showToast(text);
    }catch(error){host.showToast((error as Error).message);}finally{pending.delete(c);}
  });
}
