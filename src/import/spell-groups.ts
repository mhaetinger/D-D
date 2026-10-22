import {type Engine,type Sheet} from '../rules/model';

/** Organiza a apresentação, sem ordenar o array salvo ou remontar editores.
 * Uma mudança de círculo/origem só move o cartão depois de sair da edição. */
export function groupImportSpells(list:HTMLElement,c:Sheet,E:Engine) {
  if(list.contains(document.activeElement))return;
  const scroll=list.closest<HTMLElement>('#confirmationExtra'),top=scroll?.scrollTop;
  const cards=[...list.querySelectorAll<HTMLElement>('[data-import-spell]')];
  const groups=new Map<string,{circle:number;classId:string;cards:HTMLElement[]}>();
  const race=E.options.races[c.rules?.raceId];
  for(const card of cards){const s=c.spells[Number(card.dataset.importSpell)],circle=Number.isInteger(s.circle)?s.circle:-1,classId=race&&s.extraSource===race.name?'race':s.classId||'',key=circle+':'+classId;
    if(!groups.has(key))groups.set(key,{circle,classId,cards:[]});groups.get(key)!.cards.push(card);
  }
  const circles=[...new Set([...groups.values()].map(g=>g.circle))].sort((a,b)=>a-b);
  let position=0;
  for(const circle of circles){
    let section=[...list.children].find(el=>(el as HTMLElement).dataset.importCircle===String(circle)) as HTMLElement|undefined;
    if(!section){section=document.createElement('section');section.className='import-spell-circle';section.dataset.importCircle=String(circle);section.innerHTML='<h3><span class="import-circle-mark" aria-hidden="true"></span><span data-import-circle-title></span><small data-import-circle-count></small></h3>';}
    section.querySelector('.import-circle-mark')!.textContent=circle<0?'!':String(circle);
    section.querySelector('[data-import-circle-title]')!.textContent=circle===0?'Truques · sem espaço de magia':circle<0?'Escolha o grupo destes efeitos':circle+'º círculo de magia';
    section.querySelector('[data-import-circle-count]')!.textContent=String([...groups.values()].filter(g=>g.circle===circle).reduce((n,g)=>n+g.cards.length,0));
    const classGroups=[...groups.values()].filter(g=>g.circle===circle).sort((a,b)=>c.classes.findIndex((x:Sheet)=>x.classId===a.classId)-c.classes.findIndex((x:Sheet)=>x.classId===b.classId));
    for(const group of classGroups){
      let origin=[...section.children].find(el=>(el as HTMLElement).dataset.importSpellClass===group.classId) as HTMLElement|undefined;
      if(!origin){origin=document.createElement('div');origin.className='import-spell-class';origin.dataset.importSpellClass=group.classId;origin.innerHTML='<h4></h4>';section.append(origin);}
      origin.querySelector('h4')!.textContent=group.classId==='race'?'Raça · '+race.name:group.classId==='bruxo'&&circle>0?'Bruxo · Magia de Pacto':E.data.classes[group.classId]?.name||'⚠ Origem a confirmar';
      for(const card of group.cards)if(card.parentElement!==origin)origin.append(card);
    }
    if(list.children[position]!==section)list.insertBefore(section,list.children[position]||null);
    position++;
  }
  for(const section of list.querySelectorAll<HTMLElement>('.import-spell-circle,.import-spell-class'))if(!section.querySelector('[data-import-spell]'))section.remove();
  if(scroll&&top!==undefined)scroll.scrollTop=top;
}
