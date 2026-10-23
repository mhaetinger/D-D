import {ability, level, selections, subclass, type Engine, type Sheet} from './model';
import {elementalAffinityBonus} from './passives';
import {parseDiceFormula} from './dice-formula';
import type {DiceResult} from './dice-roll';

const signed = (n:number) => n === 0 ? '' : n > 0 ? `+${n}` : String(n);
const dice = (n:number, sides:number, modifier=0) => `${n}d${sides}${signed(modifier)}`;
export function innateCastLevel(c:Sheet, s:Sheet, E:Engine):number {
  const racial = c.rules?.raceId==='tiefling' && s.extraSource===E.options.races.tiefling.name && (s.bookId || E.spell(s.name)?.id)==='repreensao-infernal';
  return Number(s.castLevel ?? (racial ? 2 : s.circle));
}
export function twinEligible(c:Sheet, s:Sheet, circle:number, E:Engine, fallback?:boolean) {
  if(s.customRoll && typeof fallback==='boolean') return fallback;
  const entry=E.spell(s.bookId || s.name), meta=E.spellMeta(entry || s);
  if (!entry) return !!fallback;
  if (entry.id==='misseis-magicos') return true; // Adaptação da mesa já identificada na consulta.
  if (entry.id==='rajada-mistica') return c.classes.reduce((n:number,x:Sheet)=>n+x.level,0)<5;
  if (entry.id==='raio-ardente') return false;
  const higher=entry.text.split(/Em Níveis Superiores\./i)[1] || '';
  if (circle>entry.level && /(?:criatura|alvo) adicional/i.test(higher)) return false;
  return !!meta.canTwin;
}

export interface SpellEffect {
  formula:string|null; summary:string; canTwin:boolean; perRay:boolean; explanation:string; affinity?:number;
  components?:{formula:string;type:string;label:string}[];
  evocation?:number;
}
/** Distribui as faces já roladas na ordem dos componentes, sem sortear de novo
 * nem mudar o total/pool. Tipos e escolhas continuam legíveis para a mesa. */
export function spellDamageBreakdown(result:DiceResult,components:NonNullable<SpellEffect['components']>):DiceResult {
  const offsets:Record<number,number>={},lines:string[]=[];
  for(const part of components){
    const parsed=parseDiceFormula(part.formula);if(!parsed)return result;
    let total=parsed.modifier;
    for(const [sides,count]of Object.entries(parsed.counts)){
      const key=Number(sides),start=offsets[key] || 0,faces=result.groups.find(g=>g.sides===key)?.faces.slice(start,start+count);
      if(faces?.length!==count)return result;
      total+=faces.reduce((a,b)=>a+b,0);offsets[key]=start+count;
    }
    lines.push(`${part.label}: ${part.formula} = ${total}`);
  }
  if(result.modifier)lines.push(`Bônus fixos ${signed(result.modifier)} já incluídos no total; atribua ao componente elegível.`);
  return {...result,breakdown:[...result.breakdown,...lines]};
}
/** Uma resolução atende prévia e rolador. Fórmulas do jogador têm precedência;
 * os trechos genéricos só ampliam dados quando o texto explicita esse aumento. */
export function resolveSpellEffect(c:Sheet, s:Sheet, circle:number, E:Engine, options:{twinned?:boolean;legacyFormula?:string|null;legacySummary?:string;canTwin?:boolean;elementalAffinity?:boolean}={}):SpellEffect {
  const entry=E.spell(s.bookId || s.name), meta=E.spellMeta(entry || s), canTwin=twinEligible(c,s,circle,E,options.canTwin);
  const twin=!!options.twinned && canTwin;
  if (s.customRoll) return {formula:s.customRoll,summary:s.customRoll,canTwin,perRay:false,explanation:'Fórmula personalizada preservada, sem bônus automáticos adicionais.'};
  let formula=options.legacyFormula || meta.diceFormula || null;
  let summary=options.legacySummary || meta.effectSummary || s.effectSummary || s.notes || 'Consultar descrição';
  const text=String(entry?.text || '').replace(/\s+/g,' '), base=Number(entry?.level ?? s.circle);
  const total=c.classes.reduce((n:number,x:Sheet)=>n+x.level,0), scale=total>=17?4:total>=11?3:total>=5?2:1;
  const match=formula?.match(/^(\d+)d(\d+)([+-]\d+)?$/), id=entry?.id;
  const perRay=id==='rajada-mistica' || id==='raio-ardente';
  let components:SpellEffect['components'];
  let explanation='Efeitos, acertos e condições do alvo seguem a descrição da magia.';
  if (id==='misseis-magicos') {
    const count=(2+circle)*(twin?2:1);
    return {formula:dice(count,4,count),summary:`${count} mísseis (${dice(count,4,count)})`,canTwin,perRay:false,explanation:twin?'Magia Gêmea em Mísseis Mágicos é adaptação da mesa.':'Cada míssil causa 1d4+1 de energia.'};
  }
  if (id==='rajada-mistica') {
    const bonus=selections(c,E,'invocations').includes('Explosão Agonizante')?ability(c,'cha'):0;
    formula=dice(1,10,bonus);
    summary=`${scale} feixe(s) × ${formula} Energia`;
    explanation='Cada feixe exige seu próprio ataque. Role o dano de um feixe que acertou; o botão de dano não lança a magia novamente.';
  } else if (id==='raio-ardente') {
    formula='2d6';summary=`${3+Math.max(0,circle-base)} raio(s) × 2d6 Fogo`;
    explanation='Cada raio exige seu próprio ataque. Role o dano de um raio que acertou, sem gastar outro espaço.';
  } else if (!s.customSpell && (id==='cura-completa' || id==='cura-completa-em-massa')) {
    // Valores fixos, sem rolagem. Discípulo da Vida soma 2 + círculo do espaço
    // a cada criatura curada (Livro do Jogador 2014, p. 70 / PDF 69).
    const life=level(c,'clerigo')>=1 && subclass(c,'clerigo',E)==='vida'?2+circle:0;
    formula=null;
    summary=id==='cura-completa'
      ? `${70+10*Math.max(0,circle-base)} PV${life?` +${life} Discípulo da Vida`:''} · encerra cegueira, surdez e doenças`
      : `Até 700 PV divididos à sua escolha${life?` · +${life} por criatura curada (Discípulo da Vida)`:''} · encerra cegueira, surdez e doenças`;
    explanation='Cura de valor fixo: aplique o total na mesa, sem rolagem. Não afeta mortos-vivos ou constructos.';
  } else if (meta.damageComponents) {
    components=meta.damageComponents.map((part:{formula:string;type:string;label:string},index:number)=>{
      const extra=Math.max(0,circle-base),m=part.formula.match(/^(\d+)d(\d+)$/)!;
      // Tempestade amplia só concussão; Coluna deixa os dados adicionais
      // separados para a mesa escolher fogo ou radiante.
      const count=Number(m[1])+(id==='tempestade-de-gelo' && index===0?extra:0);
      return {...part,formula:dice(count,Number(m[2]))};
    });
    if(id==='coluna-de-chamas' && circle>base)components!.push({formula:dice(circle-base,6),type:'escolha',label:'Fogo ou Radiante · escolha da mesa'});
    formula=components!.map(part=>part.formula).join('+');
    summary=components!.map(part=>`${part.formula} ${part.label}`).join(' + ');
    if(id==='coluna-de-chamas' && circle>base)explanation+=' Escolha na mesa se os dados adicionais são de fogo ou radiantes; os dois tipos básicos continuam separados.';
  } else if (entry && match) {
    let count=Number(match[1]), sides=Number(match[2]), bonus=Number(match[3] || 0);
    if (base===0) count=scale;
    else if (!options.legacyFormula) {
      const higher=text.split(/Em Níveis Superiores\./i)[1] || '';
      const extra=higher.match(/(?:dano(?: inicial)?|cura) aumenta em (\d+)d(\d+)/i);
      const step=['lamina-flamejante','arma-espiritual'].includes(id)?2:1;
      if (extra && Number(extra[2])===sides) count+=Math.floor(Math.max(0,circle-base)/step)*Number(extra[1]);
    }
    if (meta.dmgType==='cura') {
      const key=s.castingAbility || E.data.classes[s.classId]?.ability || (['guerreiro','ladino'].includes(s.classId)?'int':null);
      if (/modificador de (?:habilidade de )?conjuração/i.test(text) && key) bonus+=ability(c,key);
      if (base>=1 && level(c,'clerigo')>=1 && subclass(c,'clerigo',E)==='vida') bonus+=2+circle;
    }
    if(id==='arma-espiritual'){
      const key=s.castingAbility || E.data.classes[s.classId]?.ability || 'wis';
      bonus+=ability(c,key);
    }
    formula=dice(count,sides,bonus);
    summary=options.legacySummary && options.legacyFormula ? options.legacySummary.replace(options.legacyFormula,formula) : `${formula} ${meta.dmgLabel || ''}`.trim();
  }
  // Evocação Potencializada modifica uma rolagem da magia de mago, inclusive
  // valores negativos. Não concede o bônus a outra classe nem a dano manual.
  const evocation=entry && s.classId==='mago' && !s.customSpell && level(c,'mago')>=10 && subclass(c,'mago',E)==='evocacao' && entry.school==='evocação' && meta.dmgType!=='cura' && meta.dmgType!=='utilidade' && options.elementalAffinity!==false?ability(c,'int'):0;
  if (twin) {
    // Duas criaturas têm efeitos separados. O rolador reúne os dados por conveniência.
    const m=formula?.match(/^(\d+)d(\d+)([+-]\d+)?$/);
    if (m && !perRay) formula=dice(Number(m[1])*2,Number(m[2]),Number(m[3] || 0)*2);
    summary=`2 alvos × (${summary})`;
  }
  if(evocation && formula){formula+=signed(evocation);summary+=` · Evocação ${signed(evocation)} em uma rolagem`;}
  // Uma única rolagem, depois da composição de Gêmea: não soma CAR por alvo,
  // dado ou raio. Dano adicional de outro raio usa elementalAffinity:false.
  const affinityType=components?.find(part=>elementalAffinityBonus(c,part.type,E)!==0)?.type || meta.dmgType;
  const affinity=entry && formula && options.elementalAffinity!==false?elementalAffinityBonus(c,affinityType,E):0;
  if(affinity && formula && Object.keys(parseDiceFormula(formula)?.counts || {}).length) {
    formula+=signed(affinity);
    summary+=` · Afinidade ${signed(affinity)} em uma rolagem`;
    explanation+=' Afinidade Elemental soma CAR somente à rolagem inicial desta conjuração; os outros raios usam o dano sem esse bônus. Não gasta feitiçaria.';
  }
  return {formula,summary,canTwin,perRay,explanation,affinity,components,evocation};
}
