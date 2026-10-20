import {escape,type Engine,type Sheet} from './model';
import {preparation} from './spellcasting';
import {resourcesAt} from './placement';
import {renderResourceControls} from './ui';
import {PREPARATION_HELP} from './spell-help';

/** Agrupa controles existentes por origem. Não cria reservas por classe:
 * Conjuração continua compartilhada e Pacto/Feitiçaria conservam seus quadros. */
export function spellClassPanels(c:Sheet,E:Engine):string {
  const resources=resourcesAt(c,E,'spellbook');
  const classes=[...new Set<string>(c.classes.map((x:Sheet)=>x.classId))].flatMap(id=>{
    if(['feiticeiro','bruxo'].includes(id))return [];
    const cls=c.classes.find((x:Sheet)=>x.classId===id)!,meta=E.data.classes[id];
    if(!meta)return [];
    // Exige vínculo estruturado da subclasse; texto de uma ficha importada
    // não autoriza inferir Cavaleiro Arcano ou Trapaceiro Arcano.
    const sub=meta.subclasses?.[cls.subclassId],kind=sub?.casting||meta.casting;
    const start=['halfKnown','halfPrepared'].includes(kind)?2:kind==='third'?3:1;
    if(!['book','prepared','halfPrepared','known','halfKnown','third'].includes(kind)||cls.level<start)return [];
    return [{id,meta,sub,kind,prep:preparation(c,id,E)}];
  });
  if(!classes.length)return '';
  return `<div class="spell-class-panels" data-spell-class-panels>${c.ruleState?.prepareReminder&&classes.some(x=>x.prep.prepares)?'<p class="spell-prepare-reminder t-text-muted">Após o descanso, revise as magias preparadas de cada classe.</p>':''}${classes.map(({id,meta,sub,kind,prep})=>{
    const title=kind==='book'?'Grimório e preparo':prep.prepares?'Magias preparadas':kind==='third'?sub?.name||'Conjuração':'Conjuração';
    const note=kind==='book'?'Escolha no seu grimório as magias que ficarão preparadas.':prep.prepares?'Revise sua lista preparada após um descanso longo.':'As escolhas e trocas de magias ficam na evolução da classe.';
    const owned=resources.filter(r=>r.classId===id);
    // Contar o agrupamento como "magias conhecidas" confundiria origens de
    // raça, talentos e Segredos Mágicos. Só preparo tem contador verificado.
    const count=prep.prepares?`${prep.used}/${prep.limit} preparadas`:'Magias conhecidas';
    return `<section class="spell-class-panel t-card-accent" data-spell-class="${escape(id)}" aria-label="Conjuração de ${escape(meta.name)}"><header><h3 class="font-rpg font-bold t-text-accent">${escape(meta.name)} · ${escape(title)}</h3><span class="spell-class-count t-inset" ${prep.prepares?`title="${escape(PREPARATION_HELP)}"`:''}>${escape(count)}</span></header><div class="spell-class-summary"><p class="t-text-muted">${note}</p>${prep.prepares?`<button type="button" title="${escape(PREPARATION_HELP)}" data-rule-action="prepare" data-class="${escape(id)}" aria-label="Preparar magias de ${escape(meta.name)}" class="t-inset font-bold">Preparar magias</button>`:''}</div>${owned.length?`<div class="spell-class-resources rule-context" data-rule-place="spellbook">${renderResourceControls(c,E,owned)}</div>`:''}</section>`;
  }).join('')}</div>`;
}
