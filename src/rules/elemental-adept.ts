import {level,norm,type Engine,type Sheet} from './model';
import {parseDiceFormula} from './dice-formula';
import type {DiceResult} from './dice-roll';

const elements={acido:'Ácido',eletrico:'Elétrico',fogo:'Fogo',frio:'Frio',trovejante:'Trovejante'} as const;
type Element=keyof typeof elements;
const element=(value:unknown):Element|null=>{
  const normalized=norm(value),key=normalized==='trovao'?'trovejante':normalized==='gelo'?'frio':normalized;
  return Object.hasOwn(elements,key)?key as Element:null;
};
const values=(value:unknown)=>Array.isArray(value)?value:[value];

/** Cada elemento deve pertencer ao MESMO registro que concedeu o talento.
 * Texto livre, campos órfãos e escolhas de níveis/classes removidos não o concedem. */
export function elementalAdeptTypes(c:Sheet):Element[] {
  const found=new Set<Element>();
  for(const event of c.rules?.history || [])for(const key of ['feat','racialFeat']){
    if(key==='feat' && (!level(c,event.classId) || event.level>level(c,event.classId)))continue;
    if(!values(event.answers?.[key]).some(v=>norm(v)==='adepto elemental'))continue;
    for(const value of values(event.answers?.[key+'Element'])){
      const type=element(value);if(type)found.add(type);
    }
  }
  return [...found];
}

// O catálogo registra apenas uma parcela/exemplo dessas magias. Não deduzir
// elemento, rodada, camada ou efeito escolhido a partir desse primeiro valor.
const contextual=new Set(['orbe-cromatica','glifo-de-vigilancia','escudo-de-fogo',
  'rajada-prismatica','muralha-prismatica','tempestade-da-vinganca','fome-de-hadar']);
export interface ElementalAdept {types:Element[];formula:string}
export function spellElementalAdept(c:Sheet,s:Sheet,E:Engine,formula:string|null,components?:{type:string}[]):ElementalAdept|null {
  const entry=E.spell(s.bookId || s.name),parsed=parseDiceFormula(formula);
  if(!entry || !parsed || !Object.keys(parsed.counts).length || parsed.counts[20] || s.customSpell || s.customRoll || contextual.has(entry.id))return null;
  const meta=E.spellMeta(entry);
  // Parcelas do resolvedor já substituem o antigo tipo único de magias mistas.
  // Nos demais casos, um tipo editado não comprova o elemento automático.
  if(!components?.length && s.dmgType && s.dmgType!=='livro' &&
    norm(s.dmgType)!==norm(meta.dmgType) && (!element(s.dmgType) || element(s.dmgType)!==element(meta.dmgType)))return null;
  const damageTypes=(components || [{type:meta.dmgType}]).map(p=>element(p.type));
  const types=elementalAdeptTypes(c).filter(type=>damageTypes.includes(type));
  return types.length?{types,formula:parsed.formula}:null;
}
export function elementalAdeptDescription(profile:ElementalAdept) {
  const names=profile.types.map(type=>elements[type]).join(', ');
  return `Adepto Elemental (${names}): 1 nos dados de dano conta como 2; ignora resistência a ${names}, sem ignorar imunidade. OFF: resolva os dados físicos na mesa.`;
}
export const elementalAdeptNeedsReview=(c:Sheet,s:Sheet,E:Engine)=>!s.customSpell && !s.customRoll && contextual.has(E.spell(s.bookId || s.name)?.id) && elementalAdeptTypes(c).length>0;

/** Livro 2014, p. 167 / PDF 166: qualquer dado de dano da magia elegível.
 * Em dano misto, o mínimo vale para a rolagem da magia; ignorar resistência
 * continua restrito ao elemento escolhido. Faces originais ficam no resultado,
 * com ajuste explícito e sem RNG, bônus por elemento ou nova aplicação. */
export function applyElementalAdept(result:DiceResult,profile:ElementalAdept):DiceResult {
  if(result.elementalAdept)return result;
  const parsed=parseDiceFormula(profile.formula);
  if(!profile.types.length || profile.types.some(t=>!Object.hasOwn(elements,t)) || !parsed || result.d20Natural!==null || result.modifier!==parsed.modifier ||
    Object.keys(parsed.counts).length!==result.groups.length || result.groups.some(g=>parsed.counts[g.sides]!==g.faces.length))return result;
  const adjustment=result.groups.reduce((sum,g)=>sum+g.faces.filter(face=>face===1).length,0);
  return {...result,total:result.total+adjustment,elementalAdept:{types:[...profile.types],adjustment},
    breakdown:[...result.breakdown,`Adepto Elemental: ${adjustment} dado(s) com 1 tratado(s) como 2 (+${adjustment}); ignora resistência a ${profile.types.map(t=>elements[t]).join(', ')}, sem ignorar imunidade`]};
}
