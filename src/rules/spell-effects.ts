import {ability, level, selections, subclass, type Engine, type Sheet} from './model';

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
  formula:string|null; summary:string; canTwin:boolean; perRay:boolean; explanation:string;
}
/** Uma resolução atende prévia e rolador. Fórmulas do jogador têm precedência;
 * os trechos genéricos só ampliam dados quando o texto explicita esse aumento. */
export function resolveSpellEffect(c:Sheet, s:Sheet, circle:number, E:Engine, options:{twinned?:boolean;legacyFormula?:string|null;legacySummary?:string;canTwin?:boolean}={}):SpellEffect {
  const entry=E.spell(s.bookId || s.name), meta=E.spellMeta(entry || s), canTwin=twinEligible(c,s,circle,E,options.canTwin);
  const twin=!!options.twinned && canTwin;
  if (s.customRoll) return {formula:s.customRoll,summary:s.customRoll,canTwin,perRay:false,explanation:'Fórmula personalizada preservada, sem bônus automáticos adicionais.'};
  let formula=options.legacyFormula || meta.diceFormula || null;
  let summary=options.legacySummary || meta.effectSummary || s.effectSummary || s.notes || 'Consultar descrição';
  const text=String(entry?.text || '').replace(/\s+/g,' '), base=Number(entry?.level ?? s.circle);
  const total=c.classes.reduce((n:number,x:Sheet)=>n+x.level,0), scale=total>=17?4:total>=11?3:total>=5?2:1;
  const match=formula?.match(/^(\d+)d(\d+)([+-]\d+)?$/), id=entry?.id;
  const perRay=id==='rajada-mistica' || id==='raio-ardente';
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
  } else if (entry && match) {
    let count=Number(match[1]), sides=Number(match[2]), bonus=Number(match[3] || 0);
    if (base===0) count=scale;
    else if (!options.legacyFormula) {
      const higher=text.split(/Em Níveis Superiores\./i)[1] || '';
      const extra=higher.match(/(?:dano|cura) aumenta em (\d+)d(\d+)/i);
      if (extra && Number(extra[2])===sides) count+=Math.max(0,circle-base)*Number(extra[1]);
    }
    if (meta.dmgType==='cura') {
      const key=s.castingAbility || E.data.classes[s.classId]?.ability || (['guerreiro','ladino'].includes(s.classId)?'int':null);
      if (/modificador de (?:habilidade de )?conjuração/i.test(text) && key) bonus+=ability(c,key);
      if (base>=1 && level(c,'clerigo')>=1 && subclass(c,'clerigo',E)==='vida') bonus+=2+circle;
    }
    formula=dice(count,sides,bonus);
    summary=options.legacySummary && options.legacyFormula ? options.legacySummary.replace(options.legacyFormula,formula) : `${formula} ${meta.dmgLabel || ''}`.trim();
  }
  if (twin) {
    // Duas criaturas têm efeitos separados. O rolador reúne os dados por conveniência.
    const m=formula?.match(/^(\d+)d(\d+)([+-]\d+)?$/);
    if (m && !perRay) formula=dice(Number(m[1])*2,Number(m[2]),Number(m[3] || 0)*2);
    summary=`2 alvos × (${summary})`;
  }
  return {formula,summary,canTwin,perRay,explanation};
}
