import {escape,type Sheet} from '../rules/model';
import {validateImport} from '../import/character-review';
import {parseDiceFormula} from '../rules/dice-formula';
import {sheetStore} from '../storage/character-store';

const host=window as any;
const damageTypes={utilidade:'Utilidade',cura:'Cura',defesa:'Defesa',fogo:'Fogo',frio:'Frio',eletrico:'Elétrico',acido:'Ácido',veneno:'Veneno',necrotico:'Necrótico',radiante:'Radiante',psiquico:'Psíquico',trovejante:'Trovejante',energia:'Energia',cortante:'Cortante',perfurante:'Perfurante',concussao:'Concussão'};
const defenses={nenhuma:'Sem ataque/resistência',atq_magico:'Ataque contra CA',auto_hit:'Acerto automático',tr_for:'Resistência de Força',tr_des:'Resistência de Destreza',tr_con:'Resistência de Constituição',tr_int:'Resistência de Inteligência',tr_sab:'Resistência de Sabedoria',tr_car:'Resistência de Carisma'};

/** Catálogo e adaptações compartilham origem, recursos e controles da ficha.
 * Só substitui a entrada após validar a proposta completa; não toca notas. */
export async function openSpellEditor(index:number|null=null):Promise<void> {
  const c=host.getChar(),E=host.CharacterEngine,store=sheetStore;
  if(!c || (document.getElementById('confirmationDialog') as HTMLDialogElement).open)return;
  const existing=index===null?null:c.spells[index];if(index!==null&&!existing)return;
  host.hideBookTooltip();
  const before=JSON.stringify(c),controls=document.createElement('div');controls.className='rule-context import-review';
  controls.dataset.spellEditor='';
  const draft:Sheet=structuredClone(existing||{name:'',circle:0,classId:c.classes[0].classId,castingAbility:E.data.classes[c.classes[0].classId]?.ability||'',prepared:true,extraSource:'Adição manual · adaptação da mesa',customRoll:'',notes:'',dmgType:'utilidade',defType:'nenhuma',range:'',time:'1 ação',conc:false,v:false,s:false,m:false});
  const select=(id:string,label:string,values:Record<string,string>,value:any)=>`<label>${label}<select data-spell-field="${id}">${Object.entries(values).map(([k,v])=>`<option value="${escape(k)}" ${k===value?'selected':''}>${escape(v)}</option>`).join('')}</select></label>`;
  const input=(id:string,label:string,type='text',min?:number,max?:number)=>`<label>${label}<input data-spell-field="${id}" type="${type}" ${min!==undefined?`min="${min}"`:''} ${max!==undefined?`max="${max}"`:''} ${type==='number'?'step="1"':''} value="${escape(draft[id]??'')}"></label>`;
  const check=(id:string,label:string)=>`<label class="import-check"><input data-spell-field="${id}" type="checkbox" ${draft[id]?'checked':''}>${label}</label>`;
  const catalogue=!!E.spell(draft.bookId||draft.name);
  if(catalogue){const meta=E.spellMeta(E.spell(draft.bookId||draft.name));if(!draft.dmgType||draft.dmgType==='livro')draft.dmgType=meta.dmgType;if(!draft.defType||draft.defType==='nenhuma')draft.defType=meta.defType;}
  controls.innerHTML=`<p>Magias do catálogo mantêm seus efeitos do livro. Personalizadas usam a fórmula e a descrição escritas, sem escalonamento automático. Adições livres são adaptações da mesa.</p>
    <div class="import-grid">${select('editorMode','Magia',{catalog:'Escolher no catálogo',custom:'Criar personalizada'},catalogue||!existing?'catalog':'custom')}<label data-spell-catalog-label>Buscar no catálogo<input data-spell-catalog list="manual-spell-catalog" value="${escape(catalogue?E.spell(draft.bookId||draft.name).name:'')}"></label></div>
    <datalist id="manual-spell-catalog">${Object.values(E.spells).map((s:any)=>`<option value="${escape(s.name)}"></option>`).join('')}</datalist>
    <div class="import-grid">${input('name','Nome')}${input('circle','Círculo (0 = truque)','number',0,9)}${select('classId','Classe / agrupamento',Object.fromEntries(c.classes.map((x:Sheet)=>[x.classId,E.data.classes[x.classId].name])),draft.classId)}${select('castingAbility','Habilidade de conjuração',{'':'Da classe',...E.data.abilities},draft.castingAbility||'')}${input('extraSource','Origem / adaptação da mesa')}${check('prepared','Preparada')}${check('alwaysPrepared','Sempre preparada · adaptação confirmada')}</div>
    <div class="import-grid">${input('customRoll','Fórmula personalizada (opcional)')}${select('defType','Jogada do alvo',defenses,draft.defType||'nenhuma')}${select('dmgType','Tipo de efeito',damageTypes,draft.dmgType||'utilidade')}${input('range','Alcance')}${input('time','Tempo de conjuração')}${check('conc','Exige concentração')}</div>
    <details><summary>Usos e outros ajustes</summary><div class="import-grid">${select('castMode','Forma de lançamento',{normal:'Normal · consome espaço, exceto truques',ritual:'Somente ritual',atWill:'À vontade · sem espaço',limited:'Usos da origem · sem espaço'},draft.ritual?'ritual':draft.atWill?'atWill':draft.limitedUse?'limited':'normal')}${input('limitedUse','Máximo de usos','number',1,100)}${input('usesUsed','Usos gastos','number',0,100)}${input('castLevel','Círculo de lançamento da origem (opcional)','number',1,9)}${input('duration','Duração / limite da concentração')}${select('recovery','Recuperar usos',{long:'Descanso longo',short:'Descanso curto'},draft.recovery||'long')}${input('attackAdjustment','Ajuste de ataque','number',-100,100)}${input('dcAdjustment','Ajuste de CD','number',-100,100)}${check('v','Verbal')}${check('s','Somático')}${check('m','Material')}${check('canTwin','Permitir Magia Gêmea · conferir na mesa')}</div></details>
    <label>Descrição / notas<textarea data-spell-field="notes" rows="4">${escape(draft.notes||'')}</textarea></label><p data-spell-error role="alert"></p>${existing?'<button type="button" data-spell-delete>Excluir magia</button>':''}`;
  const field=(id:string)=>controls.querySelector<HTMLInputElement|HTMLSelectElement>(`[data-spell-field="${id}"]`)!;
  const book=controls.querySelector<HTMLInputElement>('[data-spell-catalog]')!,error=controls.querySelector<HTMLElement>('[data-spell-error]')!;
  const sync=()=>{const useBook=field('editorMode').value==='catalog';book.parentElement!.hidden=!useBook;book.required=useBook;field('name').required=true;field('circle').required=true;(field('name') as HTMLInputElement).readOnly=useBook;(field('circle') as HTMLInputElement).readOnly=useBook;const limited=field('castMode').value==='limited';for(const id of ['limitedUse','usesUsed','recovery']){field(id).parentElement!.hidden=!limited;field(id).disabled=!limited;}field('limitedUse').required=limited;};
  controls.addEventListener('change',e=>{
    error.textContent='';const el=e.target as HTMLInputElement;
    if(el===book || el===field('editorMode')&&field('editorMode').value==='catalog') {
      const entry=E.spell(book.value);book.setCustomValidity(book.value&&!entry?'Escolha o nome de uma magia do catálogo.':'');
      if(entry){const s=E.toSheetSpell(entry,field('classId').value);for(const id of ['name','circle','range','time','defType','dmgType','conc','v','s','m','canTwin']){const f=field(id) as HTMLInputElement;if(f.type==='checkbox')f.checked=!!s[id];else f.value=String(s[id]??'');}field('customRoll').value='';}
    }
    if(el===field('editorMode')&&el.value==='custom')book.setCustomValidity('');
    sync();
  });
  let remove=false;
  controls.querySelector('[data-spell-delete]')?.addEventListener('click',()=>{remove=true;(document.getElementById('confirmationDialog') as HTMLDialogElement).close('confirm');});
  const dialog=document.getElementById('confirmationDialog') as HTMLDialogElement,form=dialog.querySelector('form')!;
  let candidate:Sheet|undefined;
  const validate=(e:SubmitEvent)=>{
    if((e.submitter as HTMLButtonElement)?.value!=='confirm')return;
    try {
      const s:Sheet={...draft};
      for(const el of controls.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('[data-spell-field]')) {
        const id=el.dataset.spellField!;if(['editorMode','castMode'].includes(id))continue;
        s[id]=el.type==='checkbox'?(el as HTMLInputElement).checked:el.type==='number'?el.value===''?undefined:Number(el.value):el.value.trim();
      }
      const entry=field('editorMode').value==='catalog'?E.spell(book.value):null;
      if(field('editorMode').value==='catalog'&&!entry)throw new Error('Escolha uma magia do catálogo.');
      if(!s.name)throw new Error('Informe o nome da magia.');
      if(!Number.isInteger(s.circle))throw new Error('Informe um círculo inteiro entre 0 e 9.');
      if(entry){s.bookId=entry.id;s.customSpell=false;s.ritualAvailable=!!entry.ritual;s.name=entry.name;s.circle=entry.level;}
      else {s.bookId=existing?.customSpell?existing.bookId:'custom_'+crypto.randomUUID();s.customSpell=true;s.ritualAvailable=false;}
      if(s.customRoll){const parsed=parseDiceFormula(s.customRoll);if(!parsed)throw new Error('Fórmula inválida. Exemplo: 3d6+4 (até 100 dados).');s.customRoll=parsed.formula;}
      for(const id of ['attackAdjustment','dcAdjustment'])if(s[id]!==undefined&&(!Number.isInteger(s[id])||Math.abs(s[id])>100))throw new Error('Ajustes de ataque/CD devem ser inteiros entre −100 e 100.');
      if(s.castLevel!==undefined&&(!Number.isInteger(s.castLevel)||s.castLevel<1||s.castLevel>9))throw new Error('O círculo de lançamento da origem deve ficar entre 1 e 9, ou vazio.');
      const mode=field('castMode').value;s.ritual=mode==='ritual';s.atWill=mode==='atWill';
      if(mode!=='limited'){delete s.limitedUse;delete s.usesUsed;delete s.recovery;}
      else s.usesUsed ||= 0;
      for(const k of ['castingAbility','extraSource','attackAdjustment','dcAdjustment','castLevel'])if(s[k]===undefined||s[k]==='')delete s[k];
      const copy=structuredClone(c);if(index===null)copy.spells.push(s);else copy.spells[index]=s;
      validateImport(copy,E);candidate=s;
    }catch(err){e.preventDefault();error.textContent=(err as Error).message;error.scrollIntoView({block:'nearest'});}
  };
  sync();form.addEventListener('submit',validate);dialog.classList.add('import-review-open');
  let ok=false;
  try {ok=await host.confirmDestructiveAction(existing?'Editar magia':'Adicionar magia','Escolha o vínculo e a origem. A ficha só muda ao salvar.','Salvar magia',controls);}
  finally {form.removeEventListener('submit',validate);dialog.classList.remove('import-review-open');}
  if(!ok || store!==sheetStore || c!==host.getChar() || JSON.stringify(c)!==before)return;
  if(remove){await host.deleteSheetEntry('spell',index);return;}
  if(!candidate)return;
  if(index===null)c.spells.push(candidate);else c.spells[index]=candidate;
  host.recordStepAndSave(`${existing?'Editou':'Adicionou'} magia: ${candidate.name}`);
}

export function setupSpellEditor():void {host.openSpellEditor=openSpellEditor;}
