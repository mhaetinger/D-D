import {active,level,norm,state,subclass,type Engine,type Sheet} from './model';
import {hasFeat} from './passives';
import {incapacityReason} from './concentration';
import {deathStatus,healHitPoints,hitPointMaximum} from './health';
import {hasCondition} from './conditions';
import {resourcesFor,spend} from './resources';
import {invalidBardic,receivedBardic,endReceivedBardic,type BardicInspiration} from './bardic-received';

const record=(x:unknown)=>x!=null && typeof x==='object' && !Array.isArray(x);
export function readableSupportState(c:Sheet) {
  if(c.ruleState!=null && !record(c.ruleState))throw new Error('Registro de regras ilegível preservado.');
  for(const key of ['used','active','pools','targets','conditions'])if(c.ruleState?.[key]!=null && !record(c.ruleState[key]))throw new Error('Registro de regras ilegível preservado.');
}
function acting(c:Sheet) {
  readableSupportState(c);
  if(incapacityReason(c))throw new Error('É preciso poder agir para usar este recurso.');
  if(active(c,'druida:wildShape'))throw new Error('Esta ação em Forma Selvagem continua na mesa; confira a capacidade física da forma.');
}
export const healerKit=(item:Sheet)=>['kit de primeiros socorros','kit do curandeiro','healer s kit'].includes(norm(item?.name));
export function kitBalance(item:Sheet) {
  if(!healerKit(item) || !Number.isSafeInteger(item.qty) || item.qty<1 || !Number.isSafeInteger(item.qty*10))throw new Error('Confira o kit e sua quantidade no inventário.');
  const max=item.qty*10,value=item.healerKitUses;
  if(value!==undefined && (!Number.isSafeInteger(value) || value<0 || value>max))throw new Error('Saldo de usos do kit ilegível ou fora do máximo preservado.');
  return {max,value:value as number|undefined};
}
/** Só compras de uma unidade nova conhecida acrescentam dez usos; edições e
 * importações não tornam automaticamente cheios os kits que já existiam. */
export function addPurchasedKitUses(item:Sheet) {
  if(!healerKit(item))return;
  try{const {value}=kitBalance(item);if(value!==undefined)item.healerKitUses=value+10;}catch{/* Preserva o registro ilegível; a compra não o recupera silenciosamente. */}
}
export interface HealerChoice {kit:number;available:number;self:boolean;target:string;hitDice:number;declared:boolean;eligible:boolean;mode:'heal'|'stabilize';face:number}
export function previewHealer(c:Sheet,choice:HealerChoice,E:Engine) {
  acting(c);
  if(!hasFeat(c,E,'Curandeiro'))throw new Error('Curandeiro exige o talento vigente.');
  if(!choice || !['heal','stabilize'].includes(choice.mode) || typeof choice.self!=='boolean')throw new Error('Escolha tratamento ou estabilização e o destinatário.');
  const item=c.inventoryItems?.[choice.kit],balance=kitBalance(item);
  if(!Number.isSafeInteger(choice.available) || choice.available<1 || choice.available>balance.max)throw new Error('Informe os usos atualmente disponíveis no kit, de 1 ao máximo.');
  if(choice.declared!==true)throw new Error('Confirme a ação, o kit disponível e acesso à criatura; estabilização exige criatura viva morrendo a 0 PV.');
  if(typeof choice.target!=='string' || !choice.target.trim() || choice.target.trim().length>80)throw new Error('Identifique o destinatário em até 80 caracteres.');
  if(choice.mode==='stabilize' && choice.self)throw new Error('Você não pode usar sua ação para estabilizar a si mesmo enquanto está morrendo.');
  const hitDice=choice.self?c.classes?.reduce((n:number,x:Sheet)=>n+x.level,0):choice.hitDice;
  if(choice.mode==='heal' && (!Number.isSafeInteger(hitDice) || hitDice<1 || hitDice>1000))throw new Error('Informe o número máximo de Dados de Vida do destinatário, não os dados restantes.');
  if(choice.eligible!==true)throw new Error('Confira na mesa a elegibilidade para recuperar PV deste talento, considerando tratamentos anteriores e descanso curto/longo do destinatário.');
  if(choice.mode==='heal' && (!Number.isInteger(choice.face) || choice.face<1 || choice.face>6))throw new Error('Informe a face do d6, de 1 a 6.');
  if(choice.self && (deathStatus(c).dead || !Number.isSafeInteger(c.hpCurrent) || !Number.isSafeInteger(hitPointMaximum(c)) || c.hpCurrent<0 || c.hpCurrent>hitPointMaximum(c) || hitPointMaximum(c)<1))throw new Error('Confira os PV do destinatário.');
  return {item,available:choice.available,remaining:choice.available-1,old:balance.value,self:choice.self,target:choice.target.trim(),hitDice,healing:choice.mode==='stabilize'?1:choice.face+4+hitDice,mode:choice.mode};
}
export function applyHealer(c:Sheet,choice:HealerChoice,E:Engine) {
  const plan=previewHealer(c,choice,E),restored=plan.self?healHitPoints(c,plan.healing):null;
  plan.item.healerKitUses=plan.remaining;
  return {...plan,restored};
}

export function bardSource(c:Sheet,E:Engine,cutting=false) {
  acting(c);
  const n=level(c,'bardo');
  if(n<1 || cutting && (n<3 || subclass(c,'bardo',E)!=='conhecimento'))throw new Error('Esta característica de bardo não está disponível.');
  const r=resourcesFor(c,E).find(x=>x.id==='bardo:inspiration');
  if(!r)throw new Error('Reserva de Inspiração de Bardo ausente.');
  const used=c.ruleState?.used?.[r.id]??0;
  if(c.ruleState?.used?.[r.id]===null || !Number.isSafeInteger(used) || used<0 || used>r.max)throw new Error('Reserva de Inspiração de Bardo ilegível preservada.');
  if(used>=r.max)throw new Error('Sem usos de Inspiração de Bardo.');
  return {resource:r,die:n>=15?12:n>=10?10:n>=5?8:6,combat:n>=3 && subclass(c,'bardo',E)==='bravura'};
}
export function giveBardic(c:Sheet,target:string,declared:boolean,E:Engine) {
  const plan=bardSource(c,E);
  if(typeof target!=='string' || !target.trim() || target.trim().length>80 || declared!==true)throw new Error('Confirme outra criatura até 18 m que possa ouvir você, sem outro dado de Inspiração de Bardo, e ação bônus no seu turno.');
  spend(c,plan.resource);return {...plan,target:target.trim()};
}
export interface CuttingChoice {target:string;kind:'attack'|'check'|'damage';total:number;declared:boolean;face:number}
export function previewCutting(c:Sheet,choice:CuttingChoice,E:Engine) {
  const plan=bardSource(c,E,true);
  if(!choice || !['attack','check','damage'].includes(choice.kind) || !Number.isSafeInteger(choice.total) || Math.abs(choice.total)>1000000 || choice.kind==='damage' && choice.total<0)throw new Error('Informe o tipo e o total da jogada; não se aplica a resistências.');
  if(typeof choice.target!=='string' || !choice.target.trim() || choice.target.trim().length>80 || choice.declared!==true)throw new Error('Confirme reação, criatura visível até 18 m que ouve e não é imune a encantamento, depois da jogada e antes da resolução.');
  if(!Number.isInteger(choice.face) || choice.face<1 || choice.face>plan.die)throw new Error(`Informe a face do d${plan.die}.`);
  return {...plan,...choice,target:choice.target.trim(),after:choice.kind==='damage'?Math.max(0,choice.total-choice.face):choice.total-choice.face};
}
export function applyCutting(c:Sheet,choice:CuttingChoice,E:Engine) {
  const plan=previewCutting(c,choice,E);spend(c,plan.resource);return plan;
}
export function previewReceiveBardic(c:Sheet,choice:Omit<BardicInspiration,'version'>,declared:boolean) {
  readableSupportState(c);
  if(invalidBardic(c))throw new Error('Inspiração recebida ilegível preservada; confira o backup.');
  if(receivedBardic(c))throw new Error('Você já tem um dado de Inspiração de Bardo. Use ou encerre o anterior.');
  if(!choice || typeof choice.source!=='string' || !choice.source.trim() || choice.source.trim().length>80 || ![6,8,10,12].includes(choice.die) || typeof choice.combat!=='boolean' || declared!==true || hasCondition(c,'surdo') || hasCondition(c,'inconsciente') || hasCondition(c,'petrificado') || deathStatus(c).dead)throw new Error('Confirme o dado recebido de outro bardo, poder ouvi-lo até 18 m, ausência de outro dado e prazo de 10 minutos.');
  return {version:1 as const,source:choice.source.trim(),die:choice.die,combat:choice.combat};
}
export function receiveBardic(c:Sheet,choice:Omit<BardicInspiration,'version'>,declared:boolean) {const plan=previewReceiveBardic(c,choice,declared);return state(c).bardicInspiration=plan;}
export interface BardicUse {kind:'check'|'attack'|'save'|'weaponDamage'|'ac';total:number;critical:boolean;declared:boolean}
export function previewBardicUse(c:Sheet,choice:BardicUse,faces:number[]) {
  readableSupportState(c);
  const buff=receivedBardic(c);
  if(!buff || invalidBardic(c))throw new Error('Não há dado recebido legível.');
  if(deathStatus(c).dead)throw new Error('Uma criatura morta não pode usar o dado recebido.');
  if(!choice || !['check','attack','save','weaponDamage','ac'].includes(choice.kind) || !Number.isSafeInteger(choice.total) || Math.abs(choice.total)>1000000 || typeof choice.critical!=='boolean')throw new Error('Confira o tipo e o total da jogada.');
  if(['weaponDamage','ac'].includes(choice.kind) && !buff.combat)throw new Error('Dano de arma/CA exigem dado recebido de Inspiração em Combate, da Bravura.');
  if(choice.kind==='ac' && incapacityReason(c))throw new Error('Incapacitado não pode usar reação para Inspiração em Combate.');
  if(choice.declared!==true)throw new Error('Confirme prazo de 10 minutos, momento antes da resolução e reação disponível se usar na CA.');
  const count=choice.kind==='weaponDamage' && choice.critical?2:1;
  if(!Array.isArray(faces) || faces.length!==count || faces.some(x=>!Number.isInteger(x) || x<1 || x>buff.die))throw new Error(`Informe ${count} face(s) do d${buff.die}.`);
  const bonus=faces.reduce((n,x)=>n+x,0);
  return {buff,...choice,faces:[...faces],count,bonus,after:choice.kind==='weaponDamage'?Math.max(0,choice.total+bonus):choice.total+bonus};
}
export function useReceivedBardic(c:Sheet,choice:BardicUse,faces:number[]) {
  const plan=previewBardicUse(c,choice,faces);endReceivedBardic(c);return plan;
}
