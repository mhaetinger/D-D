import {helpAttributes} from '../app/help';
import type {Sheet} from '../rules/model';

type Field=(path:string,label:string,min?:number,max?:number)=>string;

/** Os campos permanecem no formulário mesmo recolhidos: não se perde um
 * rascunho nem se transforma uma reserva ausente em dados novos da ficha. */
export function importPoolFields(field:Field):string {
  const group=(key:string,title:string,content:string)=>`<details class="import-pool" data-import-pool="${key}"><summary>${title}<span data-import-pool-state></span></summary>${content}</details>`;
  const slots=Array.from({length:9},(_,i)=>{const n=i+1;return `<div class="import-slot"><strong>${n}º círculo</strong><div class="import-slot-values">${field(`standardSlots.${n}.total`,'Total')}${field(`standardSlots.${n}.used`,'Usados')}</div></div>`;}).join('');
  return `<details class="import-card import-pools" data-import-pool="all"><summary ${helpAttributes('Reservas de magia','Espaços de magia e pontos de classe são recursos para usar suas habilidades, diferentes da lista de magias. Abra para conferir os totais e o que já foi gasto.')}><span><i data-lucide="wand-2" aria-hidden="true"></i> Reservas de magia</span><span data-import-pool-state></span></summary><div class="import-pool-body"><p>Total é o máximo de espaços; usados é o que já foi gasto. Feitiçaria mostra os pontos que restam. Isso é separado das magias do grimório.</p><div class="import-pool-compare"><button type="button" data-import-pools>Conferir máximos pelas classes</button><p class="import-field-help">Use se o PDF não trouxe as reservas ou se você alterou classes e níveis. A comparação mostra uma proposta antes de aplicar; não recupera usos nem pontos.</p></div><div data-import-pool-comparison></div>${group('standardSlots','Conjuração',`<div class="import-slots">${slots}</div>`)}<div class="import-pool-groups">${group('pactMagic','Magia de Pacto',`<div class="import-grid">${field('pactMagic.level','Círculo',1,5)}${field('pactMagic.total','Total')}${field('pactMagic.used','Usados')}</div>`)}${group('sorceryPoints','Pontos de Feitiçaria',`<div class="import-grid">${field('sorceryPoints.max','Máximo')}${field('sorceryPoints.current','Atuais')}</div>`)}</div></div></details>`;
}

/** Só a abertura inicial recolhe reservas vazias. Durante a edição, nunca
 * fecha o grupo do usuário; valores novos ou inválidos revelam a correção. */
export function syncImportPoolDisclosures(root:HTMLElement,c:Sheet,initial=false):void {
  const validPair=(max:unknown,used:unknown)=>typeof max==='number'&&typeof used==='number'&&Number.isInteger(max)&&Number.isInteger(used)&&max>=0&&max<=100&&used>=0&&used<=max;
  const slots=Array.from({length:9},(_,i)=>c.standardSlots[i+1]||{});
  const states={
    standardSlots:{empty:slots.every(s=>s.total===0&&s.used===0),valid:slots.every(s=>validPair(s.total,s.used)),zero:'Sem espaços',filled:'Espaços preenchidos'},
    pactMagic:{empty:c.pactMagic.total===0&&c.pactMagic.used===0,valid:validPair(c.pactMagic.total,c.pactMagic.used)&&Number.isInteger(c.pactMagic.level)&&c.pactMagic.level>=1&&c.pactMagic.level<=5,zero:'Sem espaços',filled:'Espaços preenchidos'},
    sorceryPoints:{empty:c.sorceryPoints.max===0&&c.sorceryPoints.current===0,valid:validPair(c.sorceryPoints.max,c.sorceryPoints.current),zero:'Sem pontos',filled:'Pontos preenchidos'}
  };
  const groups=Object.values(states),all={empty:groups.every(s=>s.empty),valid:groups.every(s=>s.valid),zero:'Sem reservas',filled:'Reservas preenchidas'};
  for(const [key,state] of Object.entries({...states,all})){
    const details=root.querySelector<HTMLDetailsElement>(`[data-import-pool="${key}"]`)!;
    const empty=state.empty&&state.valid;
    details.querySelector('[data-import-pool-state]')!.textContent=!state.valid?'Valores a conferir':empty?state.zero:state.filled;
    if(initial)details.open=!empty;
    else if(details.dataset.importPoolEmpty==='true'&&!empty)details.open=true;
    details.dataset.importPoolEmpty=String(empty);
  }
}
