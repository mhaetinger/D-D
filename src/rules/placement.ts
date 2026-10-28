import { norm, type Engine, type Sheet } from './model';
import { resourcesFor, type Resource } from './resources';

/** Um controle tem um único lugar. Referências do livro continuam nas características. */
export function resourcePlace(c:Sheet,r:Resource) {
  if (r.id==='patrulheiro:companion') return 'features';
  if (r.kind==='note') return 'reference';
  if (['feiticeiro:meta-magia-acelerada','feiticeiro:bendLuck'].includes(r.id)) return 'existing';
  if (r.classId==='feiticeiro') return 'sorcery';
  if (r.id.startsWith('bruxo:arcanum') && c.spells.some((s:Sheet)=>s.classId==='bruxo' && s.limitedUse && /arcanum|arcana mistica|arcano mistico/.test(norm(s.extraSource)) && 'bruxo:arcanum'+s.circle===r.id)) return 'existing';
  if (r.id==='bruxo:master') return 'pact';
  if (r.action==='slotRecovery') return 'spellbook';
  if (['mago:ward','druida:wildShape','druida:combatHealing'].includes(r.id)) return 'health';
  return 'features';
}

const featureNames:Record<string,string> = {
  'barbaro:frenzy':'Frenesi', 'guerreiro:superiority':'Superioridade em Combate',
  'clerigo:wrath':'Ira da Tormenta', 'monge:ki':'Chi', 'monge:astral':'Corpo Vazio',
  'mago:portent':'Prodígio', 'mago:illusorySelf':'Eu Ilusório', 'mago:stone':'Pedra de Transmutador',
};
const featureKey = (name:string) => norm(name.split('·')[0].replace(/\([^)]*\)/g,''));

export function resourcesAt(c:Sheet,E:Engine,place:string) {
  return resourcesFor(c,E).filter(r=>resourcePlace(c,r)===place);
}

/** Insere a ação na característica já existente, sem duplicar seu título/texto.
 * Fichas importadas incompletas recebem apenas a entrada que estiver faltando. */
export function featureResourceBindings(c:Sheet,E:Engine) {
  const gains:Sheet[] = [...E.features(c)], bindings = new Map<number,Resource[]>();
  for (const r of resourcesAt(c,E,'features')) {
    if(r.id==='race:breath'){
      let index=gains.findIndex(g=>!g.classId && norm(g.name)==='arma de sopro');
      if(index<0){index=gains.length;gains.push({name:'Arma de Sopro',source:E.options.races.draconato.name,level:1,reference:E.reference('Arma de Sopro',null,'draconato','race')});}
      bindings.set(index,[...(bindings.get(index) || []),r]);continue;
    }
    if(r.id==='feat:lucky' || r.id==='feat:superiority') {
      const featName=r.id==='feat:lucky'?'Sortudo':'Adepto Marcial';
      // O traço racial homônimo não tem classId; não pendurar pontos nele.
      let index=gains.findIndex(g=>g.classId && norm(g.name)===norm(featName));
      if(index<0) {index=gains.length;gains.push({name:featName,source:'Talentos',reference:E.reference(featName,null,null,'feat')});}
      if(r.id==='feat:superiority'){
        const reference=gains[index].reference || E.reference(featName,null,null,'feat');
        gains[index]={...gains[index],reference:{...reference,text:`Regra aplicada: Adepto Marcial concede um dado d6 adicional pela errata oficial do livro de 2014. Superioridade em Combate Aprimorada melhora seus dados no nível 10/18 de Mestre de Batalha. ${r.note}\n\nTexto do PDF (redação anterior à errata):\n${reference?.text || ''}`}};
      }
      bindings.set(index,[...(bindings.get(index) || []),r]);continue;
    }
    const arcanum=r.id.startsWith('bruxo:arcanum');
    const name = arcanum?`Arcana Mística (${r.id.slice(-1)}º círculo)`:r.id==='shared:channel' && r.classId==='paladino'?'Juramento Sagrado':featureNames[r.id] || (r.id.startsWith('monge:shadow-')?'Artes Sombrias':r.id.startsWith('monge:discipline-')?'Discípulo dos Elementos':r.name);
    let index = gains.findIndex(g=>g.classId===r.classId && (arcanum?norm(g.name)===norm(name):featureKey(g.name)===featureKey(name)));
    if (index<0) {
      index=gains.length;
      gains.push({name,level:c.classes.find((x:Sheet)=>x.classId===r.classId)?.level,classId:r.classId,source:E.data.classes[r.classId]?.name,reference:E.reference(name,r.classId)});
    }
    const list = bindings.get(index) || []; list.push(r); bindings.set(index,list);
  }
  return {gains,bindings};
}
