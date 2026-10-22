import {helpAttributes} from '../app/help';
import {escape,type Engine,type Sheet} from '../rules/model';
import {suggestPdfPools} from './character-review';

type Field=(path:string,label:string,min?:number,max?:number)=>string;

/** Os campos permanecem no formulário mesmo recolhidos: não se perde um
 * rascunho nem se transforma uma reserva ausente em dados novos da ficha. */
export function importPoolFields(field:Field):string {
  const group=(key:string,title:string,help:string,content:string)=>`<details class="import-pool" data-import-pool="${key}"><summary>${title}<span data-import-pool-state></span></summary><p class="import-field-help">${help}</p>${content}</details>`;
  const slots=Array.from({length:9},(_,i)=>{const n=i+1;return `<div class="import-slot"><strong>${n}º círculo</strong><div class="import-slot-values">${field(`standardSlots.${n}.total`,'Máximo')}${field(`standardSlots.${n}.used`,'Gastos')}</div></div>`;}).join('');
  return `<details class="import-card import-pools" data-import-pool="all"><summary ${helpAttributes('Reservas de magia','Espaços de magia e pontos de classe são recursos para usar suas habilidades, diferentes da lista de magias. Abra para conferir os totais e o que já foi gasto.')}><span><i data-lucide="wand-2" aria-hidden="true"></i> Reservas de magia</span><span data-import-pool-state></span></summary><div class="import-pool-body"><p>Espaços são os usos disponíveis para lançar magias. Informe o máximo e quantos já foram gastos; por exemplo, máximo 4 e gastos 1 deixam 3 disponíveis. Os truques não usam espaços.</p><div data-import-pool-comparison></div>${group('standardSlots','Conjuração','Espaços separados por círculo. A lista de magias fica no Grimório.',`<div class="import-slots">${slots}</div>`)}<div class="import-pool-groups">${group('pactMagic','Magia de Pacto','Todos os espaços de Pacto têm o mesmo círculo. Isso não muda o círculo original das magias.',`<div class="import-grid">${field('pactMagic.level','Círculo dos espaços',1,5)}${field('pactMagic.total','Máximo de espaços')}${field('pactMagic.used','Espaços gastos')}</div>`)}${group('sorceryPoints','Pontos de Feitiçaria','São pontos do feiticeiro, separados dos espaços de magia. Aqui, informe quantos restam.',`<div class="import-grid">${field('sorceryPoints.max','Pontos máximos')}${field('sorceryPoints.current','Pontos restantes')}</div>`)}</div></div></details>`;
}

/** Compara em cópia a cada mudança relevante. Ler a previsão não recupera
 * usos nem altera máximos; só o botão Aplicar confirma a proposta. */
export function syncPoolComparison(root:HTMLElement,c:Sheet,E:Engine){
  const target=root.querySelector<HTMLElement>('[data-import-pool-comparison]')!;
  const signature=JSON.stringify([c.classes,c.standardSlots,c.pactMagic,c.sorceryPoints]);
  if(target.dataset.signature===signature)return;target.dataset.signature=signature;
  const valid=c.classes.length&&c.classes.every((x:Sheet)=>E.data.classes[x.classId]&&Number.isInteger(x.level)&&x.level>=1&&x.level<=20&&(!['guerreiro','ladino'].includes(x.classId)||x.level<3||E.data.classes[x.classId].subclasses[x.subclassId]));
  if(!valid){target.innerHTML='<p>Confirme classes, níveis e as subclasses de guerreiro/ladino para ver as reservas previstas no livro.</p>';return;}
  const predicted=structuredClone(c);suggestPdfPools(predicted,E);const rows:(string|number)[][]=[];
  for(let n=1;n<=9;n++)if(c.standardSlots[n]?.total||predicted.standardSlots[n]?.total)rows.push([`Conjuração · ${n}º círculo`,c.standardSlots[n]?.total||0,predicted.standardSlots[n]?.total||0]);
  if(c.pactMagic.total||predicted.pactMagic.total)rows.push(['Pacto · círculo dos espaços',c.pactMagic.level,predicted.pactMagic.level],['Pacto · total de espaços',c.pactMagic.total,predicted.pactMagic.total]);
  if(c.sorceryPoints.max||predicted.sorceryPoints.max)rows.push(['Feitiçaria · pontos máximos',c.sorceryPoints.max,predicted.sorceryPoints.max]);
  const different=rows.some(r=>r[1]!==r[2]);
  if(different)root.querySelector<HTMLDetailsElement>('[data-import-pool="all"]')!.open=true;
  target.innerHTML=`<div class="import-pool-forecast"><h4>O que o livro prevê para estas classes</h4><p>${c.classes.map((x:Sheet)=>escape(E.data.classes[x.classId].name)+' '+x.level).join(' · ')}. Não escolhe magias nem recupera usos gastos.</p>${rows.length?`<table><thead><tr><th>Reserva</th><th>Na revisão</th><th>Pelas classes</th></tr></thead><tbody>${rows.map(row=>`<tr>${row.map((v,i)=>`<${i?'td':'th'}>${escape(v)}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table>`:'<p>As classes e níveis informados não concedem estas reservas de magia.</p>'}${different?'<button type="button" data-import-apply-pools>Usar os máximos previstos</button>':'<p class="import-field-help">Os máximos preenchidos conferem com esta previsão.</p>'}</div>`;
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
