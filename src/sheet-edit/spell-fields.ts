import {escape,type Sheet,type Engine} from '../rules/model';
import {PREPARATION_HELP,ALWAYS_PREPARED_HELP} from '../rules/spell-help';
import {helpAttributes} from '../app/help';
import {parseDiceFormula} from '../rules/dice-formula';
import {catalogSearch} from '../app/catalog-search';
import {preparation} from '../rules/spellcasting';
const damageTypes={utilidade:'Utilidade',cura:'Cura',defesa:'Defesa',fogo:'Fogo',frio:'Frio',eletrico:'Elétrico',acido:'Ácido',veneno:'Veneno',necrotico:'Necrótico',radiante:'Radiante',psiquico:'Psíquico',trovejante:'Trovejante',energia:'Energia',cortante:'Cortante',perfurante:'Perfurante',concussao:'Concussão'};
const defenses={nenhuma:'Sem ataque/resistência',atq_magico:'Ataque contra CA',auto_hit:'Acerto automático',tr_for:'Resistência de Força',tr_des:'Resistência de Destreza',tr_con:'Resistência de Constituição',tr_int:'Resistência de Inteligência',tr_sab:'Resistência de Sabedoria',tr_car:'Resistência de Carisma'};

/** Campos compartilhados entre o cartão da ficha e a cópia de importação.
 * Não acessa armazenamento, personagem global ou permissões. O dono confirma
 * e valida a proposta completa antes de persistir. Nunca cria outro form. */
export function createSpellFields(c:Sheet,existing:Sheet|null,E:Engine) {
  const controls=document.createElement('section');controls.className='spell-fields';
  const customId=existing?.customSpell?existing.bookId:'custom_'+crypto.randomUUID();
  const draft:Sheet=structuredClone(existing||{name:'',circle:0,classId:c.classes[0]?.classId||'',castingAbility:E.data.classes[c.classes[0]?.classId||'']?.ability||'',prepared:true,extraSource:'Adição livre · adaptação da mesa',customRoll:'',notes:'',dmgType:'utilidade',defType:'nenhuma',range:'',time:'1 ação',conc:false,v:false,s:false,m:false});
  const select=(id:string,label:string,values:Record<string,string>,value:any)=>`<label><span>${label}</span><select data-spell-field="${id}">${Object.entries(values).map(([k,v])=>`<option value="${escape(k)}" ${k===value?'selected':''}>${escape(v)}</option>`).join('')}</select></label>`;
  const input=(id:string,label:string,type='text',min?:number,max?:number)=>`<label><span>${label}</span><input data-spell-field="${id}" type="${type}" ${min!==undefined?`min="${min}"`:''} ${max!==undefined?`max="${max}"`:''} ${type==='number'?'step="1"':''} value="${escape(draft[id]??'')}"></label>`;
  const check=(id:string,label:string,help='')=>`<label class="import-check" ${helpAttributes(label,help)}><input data-spell-field="${id}" type="checkbox" ${help?`aria-description="${escape(help)}"`:''} ${draft[id]?'checked':''}>${label}</label>`;
  const catalogue=!draft.customSpell&&!!E.spell(draft.bookId||draft.name);
  if(catalogue){const meta=E.spellMeta(E.spell(draft.bookId||draft.name));if(!draft.dmgType||draft.dmgType==='livro')draft.dmgType=meta.dmgType;if(!draft.defType||draft.defType==='nenhuma')draft.defType=meta.defType;}
  const ambiguous=!!draft.importOriginNeedsConfirmation;
  let race=E.options.races[c.rules?.raceId];
  let originConfirmed=false;
  controls.innerHTML=`<h4 class="font-bold t-text-accent">${existing?'Editar magia':'Adicionar magia'}</h4>
    <fieldset class="spell-field-group"><legend>Magia</legend><div class="import-grid">${select('editorMode','Escolher do livro ou criar',{catalog:'Escolher no livro',custom:'Criar truque ou magia · da mesa'},catalogue||!existing?'catalog':'custom')}<div data-spell-catalog-label><label><span>Buscar pelo nome no livro</span><input data-spell-catalog value="${escape(catalogue?E.spell(draft.bookId||draft.name).name:'')}" placeholder="Digite para buscar…"></label></div>${input('name','Nome do seu truque ou magia')}${input('circle','Círculo: 0 = truque; 1 a 9 = magia','number',0,9)}</div><p data-spell-catalog-status class="spell-field-hint"></p></fieldset>
    <fieldset class="spell-field-group"><legend>Origem</legend>${ambiguous?`<p data-spell-origin-hint>De onde vem esta magia? Ela também pode ser um traço racial.</p><div class="spell-origin-choices">${c.classes.filter((x:Sheet)=>E.data.classes[x.classId]).map((x:Sheet)=>`<button type="button" data-spell-origin-choice="${escape(x.classId)}" aria-pressed="false">${escape(E.data.classes[x.classId].name)}</button>`).join('')}${race?`<button type="button" data-spell-origin-choice="race" aria-pressed="false">${escape(race.name)} · raça</button>`:''}</div><details data-spell-origin-details><summary>Conferir detalhes da origem</summary>`:''}
    <div class="import-grid">${select('classId',ambiguous?'Agrupar na ficha':'Classe da magia',{'':'Confirme a origem…',...Object.fromEntries(c.classes.filter((x:Sheet)=>E.data.classes[x.classId]).map((x:Sheet)=>[x.classId,E.data.classes[x.classId].name]))},draft.classId)}${select('castingAbility','Habilidade de conjuração',{'':'Da classe',...E.data.abilities},draft.castingAbility||'')}${input('extraSource','Característica ou adaptação (opcional)')}</div>${ambiguous?'</details>':''}</fieldset>
    <fieldset class="spell-field-group spell-preparation"><legend>Disponibilidade</legend><p data-spell-preparation-status class="spell-field-hint"></p>${check('prepared','Preparada para conjurar',PREPARATION_HELP)}</fieldset>
    <details data-spell-effect-details ${!catalogue?'open':''}><summary data-spell-effects-title>Fórmula e efeito</summary><p data-spell-effects-help class="spell-field-hint"></p><div data-spell-effects class="import-grid">${input('customRoll','Dados / fórmula própria (opcional)')}${select('defType','Como o alvo é atingido',defenses,draft.defType||'nenhuma')}${select('dmgType','Tipo de efeito',damageTypes,draft.dmgType||'utilidade')}${input('range','Alcance')}${input('time','Tempo de conjuração')}</div><div class="spell-component-checks">${check('conc','Exige concentração')}</div></details>
    <details ${draft.alwaysPrepared?'open':''}><summary>Usos e outros ajustes</summary><p class="spell-field-hint">Só altere se uma característica conceder um lançamento especial ou se houver adaptação da mesa.</p><div class="import-grid">${select('castMode','Forma de lançamento',{normal:'Normal · truques sem espaço',ritual:'Somente ritual',atWill:'À vontade · sem espaço',limited:'Usos da origem · sem espaço'},draft.ritual?'ritual':draft.atWill?'atWill':draft.limitedUse?'limited':'normal')}${input('castLevel','Lançar no círculo da origem (opcional)','number',1,9)}${input('limitedUse','Máximo de usos','number',1,100)}${input('usesUsed','Usos gastos','number',0,100)}${select('recovery','Recuperar usos',{long:'Descanso longo',short:'Descanso curto'},draft.recovery||'long')}${input('duration','Duração / concentração')}${input('attackAdjustment','Ajuste adicional de ataque','number',-100,100)}${input('dcAdjustment','Ajuste adicional de CD','number',-100,100)}</div><fieldset class="spell-components"><legend>Componentes exigidos</legend><div class="spell-component-checks">${check('v','Verbal')}${check('s','Somático')}${check('m','Material')}</div></fieldset><div class="spell-component-checks">${check('canTwin','Permitir Magia Gêmea · conferir na mesa')}${check('alwaysPrepared','Sempre preparada · característica ou adaptação confirmada',ALWAYS_PREPARED_HELP)}</div></details>
    <details data-spell-notes ${!catalogue?'open':''}><summary>Descrição e notas</summary><label>Descrição / notas<textarea data-spell-field="notes" rows="4">${escape(draft.notes||'')}</textarea></label></details>`;
  const field=(id:string)=>controls.querySelector<HTMLInputElement|HTMLSelectElement>(`[data-spell-field="${id}"]`)!;
  const book=controls.querySelector<HTMLInputElement>('[data-spell-catalog]')!;
  const search=catalogSearch(book,Object.values(E.spells).map((s:any)=>({name:s.name,detail:(s.level===0?'Truque':s.level+'º círculo')+' · '+s.classes.map((id:string)=>E.data.classes[id]?.name).filter(Boolean).join(', ')})));
  const racialGrant=()=>{
    const entry=field('editorMode').value==='catalog'?E.spell(book.value):null;
    const total=c.classes.reduce((n:number,cls:Sheet)=>n+Number(cls.level),0);
    if(!entry||!race)return null;
    const granted=Object.entries(race.racialSpells||{}).some(([lv,names]:any)=>Number(lv)<=total&&names.some((name:string)=>E.spell(name)?.id===entry.id));
    return granted || entry.level===0&&race.cantrip&&entry.classes.includes(race.cantrip)?entry:null;
  };
  const sync=()=>{
    race=E.options.races[c.rules?.raceId];
    const useBook=field('editorMode').value==='catalog',entry=useBook?E.spell(book.value):null;
    controls.querySelector<HTMLElement>('[data-spell-catalog-label]')!.hidden=!useBook;if(!useBook)search.close();book.required=useBook;field('name').parentElement!.hidden=useBook;field('name').required=true;field('classId').required=true;field('circle').required=true;
    (field('name') as HTMLInputElement).readOnly=useBook;(field('circle') as HTMLInputElement).readOnly=useBook;field('circle').parentElement!.hidden=useBook;
    controls.querySelector('[data-spell-catalog-status]')!.textContent=useBook?(entry?`${entry.level===0?'Truque':entry.level+'º círculo'} · Efeitos do livro.`:'Busque um truque ou magia pelo nome e escolha na lista.'):'Criando um efeito da mesa: escolha o círculo e preencha o efeito e a descrição abaixo.';
    controls.querySelector('[data-spell-effects-title]')!.textContent=useBook?'Ajustar efeitos do livro · opcional':Number(field('circle').value)===0?'Efeito do seu truque':'Efeito da sua magia';
    controls.querySelector('[data-spell-effects-help]')!.textContent=useBook?'O efeito já vem do livro. Preencha uma fórmula somente para substituir os dados por uma adaptação.':'Descreva o que este efeito faz. Se houver dados, use uma fórmula como 1d6+3; efeitos sem rolagem podem ficar sem fórmula.';
    const mode=field('castMode').value,limited=mode==='limited';
    for(const id of ['limitedUse','usesUsed','recovery']){field(id).parentElement!.hidden=!limited;field(id).disabled=!limited;}field('limitedUse').required=limited;
    const circle=Number(field('circle').value),classId=field('classId').value,p=preparation(c,classId,E),always=field('alwaysPrepared') as HTMLInputElement;
    // Ocultar opções sem sentido não altera o valor importado. Só uma ação
    // explícita do usuário muda a cópia; nunca corrige o preparo em silêncio.
    field('prepared').parentElement!.hidden=circle===0||!p.prepares||mode!=='normal'||always.checked;
    always.parentElement!.hidden=circle===0;
    const uses=Number(field('limitedUse').value),spent=Number(field('usesUsed').value),castLevel=field('castLevel').value;
    let availability='Sem seleção diária de preparo nesta classe.';
    if(mode==='limited')availability=`${Math.max(0,uses-spent)}/${uses} usos · descanso ${field('recovery').value==='short'?'curto':'longo'} · sem espaço de magia.${castLevel?' Lançada no '+castLevel+'º círculo.':''}`;
    else if(mode==='ritual')availability='Lançamento somente como ritual.';
    else if(circle===0)availability='Truque · não precisa preparar e não gasta espaço de magia.';
    else if(mode==='atWill')availability='À vontade · não gasta espaço de magia.';
    else if(!classId)availability='Confirme a origem para conferir o preparo.';
    else if(always.checked)availability='Sempre preparada pela característica ou adaptação registrada.';
    else if(p.prepares)availability=`${E.data.classes[classId].name} · escolha se está preparada para conjurar.`;
    controls.querySelector('[data-spell-preparation-status]')!.textContent=availability;
    const choices=controls.querySelector('.spell-origin-choices');
    if(choices){
      for(const cls of c.classes.filter((x:Sheet)=>E.data.classes[x.classId]))if(![...choices.children].some(el=>(el as HTMLElement).dataset.spellOriginChoice===cls.classId)){
        const btn=document.createElement('button');btn.type='button';btn.dataset.spellOriginChoice=cls.classId;btn.setAttribute('aria-pressed','false');btn.textContent=E.data.classes[cls.classId].name;choices.prepend(btn);
      }
      for(const btn of choices.querySelectorAll<HTMLButtonElement>('[data-spell-origin-choice]')){
        btn.hidden=btn.dataset.spellOriginChoice==='race'?!racialGrant():!entry?.classes.includes(btn.dataset.spellOriginChoice)||!c.classes.some((cls:Sheet)=>cls.classId===btn.dataset.spellOriginChoice);
        if(btn.dataset.spellOriginChoice==='race'&&race)btn.textContent=race.name+' · raça';
      }
    }
  };
  controls.addEventListener('click',e=>{
    const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-spell-origin-choice]');if(!button)return;
    const choice=button.dataset.spellOriginChoice!,racial=choice==='race',entry=racial?racialGrant():null;if(racial&&!entry)return;
    field('classId').value=racial?c.classes[0].classId:choice;
    field('castingAbility').value=racial?(race.name.startsWith('Gnomo')||race.cantrip?'int':'cha'):'';
    field('extraSource').value=racial?race.name:'';
    field('castMode').value=racial&&entry.level>0?'limited':'normal';
    if(racial&&entry.level>0){field('limitedUse').value='1';if(!field('usesUsed').value)field('usesUsed').value='0';field('recovery').value='long';}
    field('castLevel').value=racial&&c.rules?.raceId==='tiefling'&&entry.id==='repreensao-infernal'?'2':'';
    originConfirmed=true;
    for(const btn of controls.querySelectorAll<HTMLButtonElement>('[data-spell-origin-choice]'))btn.setAttribute('aria-pressed',String(btn===button));
    controls.querySelector('[data-spell-origin-hint]')!.textContent=`✓ Origem: ${button.textContent}. Confira detalhes se precisar adaptar.`;
    sync();field('classId').dispatchEvent(new Event('change',{bubbles:true}));
  });
  controls.addEventListener('change',e=>{
    // A mensagem permanece até a próxima tentativa: removê-la no blur
    // deslocaria o botão Salvar entre o pressionar e o soltar do mouse.
    const el=e.target as HTMLInputElement;
    if(el===book || el===field('editorMode')&&field('editorMode').value==='catalog') {
      const entry=E.spell(book.value);book.setCustomValidity(book.value&&!entry?'Escolha o nome de uma magia do catálogo.':'');
      if(entry){const s=E.toSheetSpell(entry,field('classId').value);for(const id of ['name','circle','range','time','defType','dmgType','conc','v','s','m','canTwin']){const f=field(id) as HTMLInputElement;if(f.type==='checkbox')f.checked=!!s[id];else f.value=String(s[id]??'');}field('customRoll').value='';}
    }
    if(el===field('editorMode')&&el.value==='custom'){book.setCustomValidity('');(controls.querySelector('[data-spell-effects]')!.parentElement as HTMLDetailsElement).open=true;controls.querySelector<HTMLDetailsElement>('[data-spell-notes]')!.open=true;}
    sync();if(el===book)search.close();
  });
  sync();
  const read=(partial=false):Sheet=>{
  const s:Sheet={...draft};
  if(originConfirmed)delete s.importOriginNeedsConfirmation;
  for(const el of controls.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('[data-spell-field]')) {
    const id=el.dataset.spellField!;if(['editorMode','castMode'].includes(id))continue;
    s[id]=el.type==='checkbox'?(el as HTMLInputElement).checked:el.type==='number'?el.value===''?undefined:Number(el.value):el.tagName==='TEXTAREA'?el.value:el.value.trim();
  }
  const entry=field('editorMode').value==='catalog'?E.spell(book.value):null;
  if(!partial&&field('editorMode').value==='catalog'&&!entry)throw new Error('Escolha uma magia do catálogo.');
  if(!partial&&!s.name)throw new Error('Informe o nome da magia.');
  if(!partial&&!Number.isInteger(s.circle))throw new Error('Informe um círculo inteiro entre 0 e 9.');
  if(entry){s.bookId=entry.id;s.customSpell=false;s.ritualAvailable=!!entry.ritual;s.name=entry.name;s.circle=entry.level;}
  else {s.bookId=customId;s.customSpell=true;s.ritualAvailable=false;}
  if(!partial&&s.customRoll){const parsed=parseDiceFormula(s.customRoll);if(!parsed)throw new Error('Fórmula inválida. Exemplo: 3d6+4 (até 100 dados).');s.customRoll=parsed.formula;}
  for(const id of ['attackAdjustment','dcAdjustment'])if(!partial&&s[id]!==undefined&&(!Number.isInteger(s[id])||Math.abs(s[id])>100))throw new Error('Ajustes de ataque/CD devem ser inteiros entre −100 e 100.');
  if(!partial&&s.castLevel!==undefined&&(!Number.isInteger(s.castLevel)||s.castLevel<1||s.castLevel>9))throw new Error('O círculo de lançamento da origem deve ficar entre 1 e 9, ou vazio.');
  const mode=field('castMode').value;s.ritual=mode==='ritual';s.atWill=mode==='atWill';
  if(mode!=='limited'){delete s.limitedUse;delete s.usesUsed;delete s.recovery;}
  else s.usesUsed ||= 0;
  for(const k of ['castingAbility','extraSource','attackAdjustment','dcAdjustment','castLevel'])if(s[k]===undefined||s[k]==='')delete s[k];
  return s;
  };
  const refreshClasses=()=>{
    const select=field('classId'),value=select.value;
    select.innerHTML='<option value="">Confirme a origem…</option>'+c.classes.filter((x:Sheet)=>E.data.classes[x.classId]).map((x:Sheet)=>`<option value="${escape(x.classId)}">${escape(E.data.classes[x.classId].name)}</option>`).join('');
    select.value=value; // Origem removida exige escolha; não é trocada em silêncio.
    sync();
  };
  return {element:controls,read,refreshClasses,field};
}
