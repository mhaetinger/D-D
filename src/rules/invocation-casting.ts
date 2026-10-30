import {ability,level,norm,proficiency,state,type Engine,type Sheet} from './model';
import {castingRestriction} from './spellcasting';
import {applyCastConcentration,concentration,concentrationBlock,spellConcentration,validateConcentrationStart} from './concentration';
import {onSpellCast,resourcesFor} from './resources';
import {resolveSpellEffect} from './spell-effects';

/** Lista conferida no Livro de 2014, pp. 61–62 (PDF 60–61). Não deduzir
 * custos do texto: "descanso longo" também pode se referir a cada criatura.
 * Livro de Segredos Antigos continua no fluxo próprio de rituais do grimório. */
export const INVOCATION_CASTS = [
  {name:'Armadura de Sombras',spell:'armadura-arcana',self:true,materialFree:true},
  {name:'Correntes de Cárceri',spell:'imobilizar-monstro',targetLimited:true,materialFree:true},
  {name:'Encharcar a Mente',spell:'lentidao',pact:true},
  {name:'Escultor de Carne',spell:'metamorfose',pact:true},
  {name:'Idioma Bestial',spell:'falar-com-animais'},
  {name:'Lacaios do Caos',spell:'conjurar-elemental',pact:true},
  {name:'Larápio dos Cinco Destinos',spell:'perdicao',pact:true},
  {name:'Máscara das Muitas Faces',spell:'disfarcar-se'},
  {name:'Mestre das Infindáveis Formas',spell:'alterar-se'},
  {name:'Palavra Terrível',spell:'confusao',pact:true},
  {name:'Passo Ascendente',spell:'levitacao',self:true,materialFree:true},
  {name:'Salto Transcendental',spell:'salto',self:true,materialFree:true},
  {name:'Sinal de Mau Agouro',spell:'rogar-maldicao',pact:true},
  {name:'Sussurros da Sepultura',spell:'falar-com-os-mortos'},
  {name:'Sussurros Sedutores',spell:'compulsao',pact:true},
  {name:'Vigor Abissal',spell:'vitalidade-falsa',self:true,materialFree:true},
  {name:'Visão Mística',spell:'detectar-magia'},
  {name:'Visões de Reinos Distantes',spell:'olho-arcano'},
  {name:'Visões nas Brumas',spell:'imagem-silenciosa',materialFree:true},
] as const;
export type InvocationCast = {name:string;spell:string;self?:boolean;materialFree?:boolean;pact?:boolean;targetLimited?:boolean};
export const invocationDefinition=(name:string):InvocationCast|undefined=>INVOCATION_CASTS.find(i=>i.name===name);
export const invocationResourceId=(name:string)=>'bruxo:invocation-'+norm(name).replace(/ /g,'-');
const record=(v:unknown)=>v!=null && typeof v==='object' && !Array.isArray(v);
function readable(c:Sheet) {
  if(c.ruleState!=null && !record(c.ruleState))throw new Error('Registro de regras ilegível preservado.');
  if(c.ruleState?.version!=null && c.ruleState.version!==1)throw new Error('Versão de regras desconhecida preservada.');
  for(const key of ['used','active','pools','targets','conditions'])if(c.ruleState?.[key]!=null && !record(c.ruleState[key]))throw new Error('Registro de regras ilegível preservado.');
}
export function previewInvocationCast(c:Sheet,name:string,E:Engine) {
  readable(c);
  const definition=invocationDefinition(name),option=E.options.invocations.find((i:Sheet)=>i.name===name);
  if(!definition || !option || level(c,'bruxo')<option.level || !E.selections(c,'bruxo','invocations').includes(name) || option.pact && !E.selections(c,'bruxo','pact').includes(option.pact))throw new Error('Invocação não disponível nesta ficha/nível/Pacto.');
  const entry=E.spell(definition.spell);if(!entry)throw new Error('Magia da invocação ausente do catálogo.');
  const spell:Sheet=E.toSheetSpell(entry,'bruxo',{extraSource:'Invocação · '+name,atWill:true,ritual:false,prepared:false});
  const blocked=castingRestriction(c,E,spell);if(blocked)throw new Error(blocked);
  if(definition.spell==='armadura-arcana' && E.armorInfo(c.armorEquipped)?.type && E.armorInfo(c.armorEquipped).type!=='shield')throw new Error('Armadura Arcana exige alvo sem armadura vestida.');
  if(definition.spell==='vitalidade-falsa' && (!Number.isSafeInteger(c.hpTemp) || c.hpTemp<0))throw new Error('Reserva de PV temporários ilegível preservada.');
  let castLevel=entry.level,remaining:number|null=null,max:number|null=null;
  const id=invocationResourceId(name);
  if(definition.pact) {
    const pact=c.pactMagic,r=resourcesFor(c,E).find(r=>r.id===id),used=c.ruleState?.used?.[id] ?? 0;
    if(!r || !Number.isSafeInteger(r.max) || r.max<0 || !Number.isSafeInteger(used) || used<0)throw new Error('Uso diário ilegível preservado.');
    max=r.max;remaining=Math.max(0,r.max-used);
    if(!remaining)throw new Error('Uso da invocação esgotado; recupera no descanso longo.');
    if(!pact || !Number.isSafeInteger(pact.level) || pact.level<entry.level || pact.level>5 || !Number.isSafeInteger(pact.total) || pact.total<1 || !Number.isSafeInteger(pact.used) || pact.used<0 || pact.used>=pact.total)throw new Error('Sem espaço de Magia de Pacto válido e livre. Espaços de Conjuração não pagam esta invocação.');
    castLevel=pact.level;
  }
  spell.castLevel=castLevel;
  const info=spellConcentration(c,spell,E,false,castLevel);
  if(info.held || info.prolonged){const blocked=concentrationBlock(c);if(blocked)throw new Error(blocked);if(info.held)validateConcentrationStart(c,info);}
  const old=concentration(c),replaces=!!old && (info.held || info.prolonged);
  const effect=resolveSpellEffect(c,spell,castLevel,E);
  // Proteção Arcana não deve concatenar um valor antigo ilegível nem
  // converter silenciosamente uma reserva de formato futuro.
  const ward=c.ruleState?.pools?.['mago:ward'];
  if(norm(entry.school)==='abjuracao' && c.classes.some((x:Sheet)=>x.classId==='mago' && x.level>=2 && (x.subclassId || E.inferSubclass(x))==='abjuracao') && ward!==undefined && (!Number.isSafeInteger(ward) || ward<0))throw new Error('Reserva de Proteção Arcana ilegível preservada.');
  const defense=E.spellMeta(entry).defType;
  const save=/^tr_(for|des|con|int|sab|car)$/.test(defense)?`${defense.slice(3).toUpperCase()} CD ${8+proficiency(c)+ability(c,'cha')} (CAR de bruxo)`:'';
  const components=definition.materialFree?entry.components.split('(')[0].split(',').map((s:string)=>s.trim()).filter((s:string)=>['V','S'].includes(s)).join(', ')+' · dispensa material':entry.components;
  return {definition,entry,spell,castLevel,id,remaining,max,info,replaces,old,effect,save,components,cost:definition.pact?`1 uso diário + 1 espaço de Pacto do ${castLevel}º círculo`:definition.targetLimited?'Sem espaço · limite por criatura':'À vontade · sem espaço'};
}
export interface InvocationChoice {declared:boolean;target?:string;targetEligible?:boolean;face?:number;temporary?:'keep'|'replace'}
/** Prévia integral em cópia: toda validação precede cobrança/concentração.
 * Não cadastra magia conhecida, não edita ataques nem grava efeitos em alvos. */
function invocationResult(c:Sheet,name:string,choice:InvocationChoice,E:Engine) {
  const p=previewInvocationCast(c,name,E);
  if(choice.declared!==true)throw new Error('Confirme componentes, alvo e tempo de conjuração disponíveis.');
  const target=choice.target?.trim() || '';
  if(p.definition.targetLimited && (!target || target.length>80 || choice.targetEligible!==true))throw new Error('Confirme celestial, corruptor ou elemental, e que esta criatura não recebeu a invocação desde seu último descanso longo.');
  const temp=p.definition.spell==='vitalidade-falsa';
  if(temp && (!Number.isSafeInteger(choice.face) || choice.face!<1 || choice.face!>4 || !['keep','replace'].includes(choice.temporary || '') || !Number.isSafeInteger(c.hpTemp) || c.hpTemp<0))throw new Error('Confira d4, reserva de PV temporários e escolha de manter/substituir.');
  const copy=structuredClone(c);
  if(p.definition.pact){copy.pactMagic.used++;state(copy).used[p.id]=(copy.ruleState.used[p.id] ?? 0)+1;}
  applyCastConcentration(copy,p.spell,E,false,p.castLevel);
  // As mesmas consequências do grimório: Proteção Arcana e recarga de
  // Transposição Benigna, sem criar uma segunda reserva para a invocação.
  onSpellCast(copy,p.spell,p.castLevel,E);
  if(p.definition.spell==='armadura-arcana')copy.mageArmorActive=true;
  const temporary=temp?choice.face!+4:null;
  if(temp && choice.temporary==='replace'){copy.hpTemp=temporary;copy.hpTempSource='Vigor Abissal · Vitalidade Falsa (1 hora)';}
  return {p,copy,target,temporary};
}
export function validateInvocationChoice(c:Sheet,name:string,choice:InvocationChoice,E:Engine) {invocationResult(c,name,choice,E);}
export function applyInvocationCast(c:Sheet,name:string,choice:InvocationChoice,E:Engine) {
  const {p,copy,target,temporary}=invocationResult(c,name,choice,E);
  // Só campos afetados; textos, histórico e magias existentes permanecem iguais.
  c.ruleState=copy.ruleState;
  if(p.definition.pact)c.pactMagic.used=copy.pactMagic.used;
  if(p.definition.spell==='armadura-arcana')c.mageArmorActive=true;
  if(temporary!==null && choice.temporary==='replace'){c.hpTemp=copy.hpTemp;c.hpTempSource=copy.hpTempSource;}
  return {name:p.entry.name,castLevel:p.castLevel,cost:p.cost,target,temporary,kept:temporary!==null && choice.temporary==='keep',summary:p.effect.summary,save:p.save};
}
