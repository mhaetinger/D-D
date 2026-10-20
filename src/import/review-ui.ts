import {escape,type Engine,type Sheet} from '../rules/model';
import {preparation} from '../rules/spellcasting';
import {catalogueWeapon,weaponStats} from '../rules/combat';
import {proposeImport,importWarnings,validateImport,suggestPdfPools} from './character-review';
import type {Backup} from '../storage/validation';

const host=window as any;
const options=(values:Record<string,Sheet>,selected:string,empty='Escolha…')=>`<option value="">${empty}</option>`+Object.entries(values).map(([id,o])=>`<option value="${escape(id)}" ${id===selected?'selected':''}>${escape(o.name)}</option>`).join('');
const at=(c:Sheet,path:string)=>path.split('.').reduce((v,k)=>v?.[k],c);
function put(c:Sheet,path:string,value:any) {const keys=path.split('.'),last=keys.pop()!;let target=c;for(const k of keys)target=target[k];target[last]=value;}
const input=(c:Sheet,path:string,label:string,type='text',required=false,min?:number,max?:number)=>`<label>${label}<input data-import-field="${path}" type="${type}" ${required?'required':''} ${min!==undefined?`min="${min}"`:''} ${max!==undefined?`max="${max}"`:''} ${type==='number'?'step="1"':''} value="${escape(at(c,path)??'')}"></label>`;
const check=(c:Sheet,path:string,label:string)=>`<label class="import-check"><input type="checkbox" data-import-field="${path}" ${at(c,path)?'checked':''}>${label}</label>`;
const abilityOptions=(value:string)=>options({str:{name:'Força'},dex:{name:'Destreza'},con:{name:'Constituição'},int:{name:'Inteligência'},wis:{name:'Sabedoria'},cha:{name:'Carisma'}},value,'Da classe');

/** A confirmação compartilha o diálogo/foco/rolagem existentes. Todas as
 * edições ficam na proposta; cancelamento e troca de conta descartam a cópia. */
export async function reviewImport(original:Backup,E:Engine,isCurrent:()=>boolean):Promise<Backup|null> {
  if(!original.characters.length)throw new Error('O arquivo não contém personagens.');
  const proposal=proposeImport(original,E),controls=document.createElement('div');controls.className='rule-context import-review';
  controls.setAttribute('data-import-review','');
  let current=0;const reviewedManual=new Set<number>();
  controls.innerHTML=`<label ${proposal.characters.length===1?'hidden':''}>Personagem <select data-import-person>${proposal.characters.map((c,i)=>`<option value="${i}">${escape(c.name||'Sem nome')} (${i+1}/${proposal.characters.length})</option>`).join('')}</select></label><p>Confira os vínculos e os valores. A importação cria fichas novas; valores manuais e textos existentes são preservados.</p><div data-import-body data-scroll-content></div><p data-import-error role="alert"></p><p data-import-status role="status"></p><label class="import-check"><input type="checkbox" data-import-ack>Conferi os avisos; manter os itens indicados como manuais.</label><label class="import-check"><input type="checkbox" data-import-notes ${proposal.privateNotes?'checked':''} ${proposal.privateNotes?'':'disabled'}>Incluir anotações pessoais${(proposal.characters[0] as Sheet).rules?.pdfImport?' e texto extraído do PDF':''}</label>`;
  const body=controls.querySelector<HTMLElement>('[data-import-body]')!,status=controls.querySelector<HTMLElement>('[data-import-status]')!,error=controls.querySelector<HTMLElement>('[data-import-error]')!,ack=controls.querySelector<HTMLInputElement>('[data-import-ack]')!;
  const char=()=>proposal.characters[current] as Sheet;
  const classes=(c:Sheet)=>Object.fromEntries(c.classes.filter((x:Sheet)=>E.data.classes[x.classId]).map((x:Sheet)=>[x.classId,E.data.classes[x.classId]]));
  function updateStatus() {
    const c=char(),warnings=importWarnings(c,E);
    const counts=c.classes.filter((x:Sheet)=>E.data.classes[x.classId]).map((x:Sheet)=>{const p=preparation(c,x.classId,E);return p.prepares?`${E.data.classes[x.classId].name}: ${p.used}/${p.limit} preparadas.`:'';}).filter(Boolean);
    status.textContent=[...counts,...warnings].join(' ');
    ack.parentElement!.hidden=!warnings.length;
    ack.checked=reviewedManual.has(current);
  }
  function subclassOptions(cls:Sheet) {
    const meta=E.data.classes[cls.classId],valid=!!meta?.subclasses?.[cls.subclassId];
    return options(meta?.subclasses||{},valid?cls.subclassId:'',meta&&cls.level<meta.subLevel?'Ainda sem subclasse':'Escolha a subclasse…')+`<option value="manual" ${cls._importManualSub?'selected':''}>Manter manual / escolher depois</option>`;
  }
  function classRow(cls:Sheet,i:number) {
    return `<div class="import-class-row" data-import-class-row="${i}"><label>Classe<select required data-import-field="classes.${i}.classId">${options(E.data.classes,cls.classId)}</select></label>${input(char(),`classes.${i}.level`,'Nível','number',true,1,20)}<label>Subclasse<select data-import-subclass="${i}">${subclassOptions(cls)}</select></label></div>`;
  }
  function render() {
    const c=char();c.rules ||= {history:[],legacy:true};
    if(!c.classes.length)c.classes.push({classId:'',level:0,subclass:'',subclassId:'',hitDie:6,hitDiceUsed:0});
    const isPdf=!!c.rules.pdfImport;
    body.innerHTML=`${isPdf?'<p>PDF: confira especialmente os espaços sugeridos por classe e seus usos atuais. Valores de perícias foram preservados como ajustes manuais. Retratos podem ser adicionados depois.</p>':''}
    <details open><summary>Identidade, classes e raça</summary><div class="import-grid">${input(c,'name','Nome', 'text',true)}${input(c,'playerName','Jogador')}${input(c,'race','Raça escrita no arquivo')}<label>Vínculo da raça<select required data-import-race>${options(E.options.races,c.rules.raceId||'','Escolha a raça…')}<option value="manual" ${c._importManualRace?'selected':''}>Personalizada / manter manual</option></select></label>${input(c,'background','Antecedente')}${input(c,'alignment','Tendência')}</div><div data-import-classes>${c.classes.map(classRow).join('')}</div><button type="button" data-import-add-class>+ Outra classe</button></details>
    <details ${isPdf?'open':''}><summary>Atributos, PV e recursos atuais</summary><div class="import-grid">${Object.entries({str:'Força',dex:'Destreza',con:'Constituição',int:'Inteligência',wis:'Sabedoria',cha:'Carisma'}).map(([id,name])=>input(c,`abilities.${id}.score`,name,'number',true,0,30)).join('')}${input(c,'hpMax','PV máximos','number',true,1)}${input(c,'hpCurrent','PV atuais','number',true,0)}${input(c,'hpTemp','PV temporários','number',true,0)}${input(c,'baseAcArmor','CA do PDF / base manual','number',true,0)}${input(c,'speed','Deslocamento','number',true,0)}</div><p>Confira as reservas: não tratamos espaços usados como espaços disponíveis.</p>${isPdf?'<button type="button" data-import-pools>Sugerir reservas pelas classes</button>':''}<div class="import-grid">${Array.from({length:9},(_,i)=>{const n=i+1;return `<div><strong>${n}º círculo</strong>${input(c,`standardSlots.${n}.total`,'Total','number',true,0,100)}${input(c,`standardSlots.${n}.used`,'Usados','number',true,0,100)}</div>`;}).join('')}${input(c,'pactMagic.level','Pacto · círculo','number',true,1,5)}${input(c,'pactMagic.total','Pacto · total','number',true,0,100)}${input(c,'pactMagic.used','Pacto · usados','number',true,0,100)}${input(c,'sorceryPoints.max','Feitiçaria · máximo','number',true,0,100)}${input(c,'sorceryPoints.current','Feitiçaria · atuais','number',true,0,100)}</div></details>
    <details ${c.spells.length?'open':''}><summary>Magias: origem e preparo (${c.spells.length})</summary><p>Escolher o recurso de Pacto/Conjuração não muda a origem da magia. Magias de talento, raça ou outra exceção precisam dessa origem e da habilidade indicadas.</p><div data-import-spells>${c.spells.map((s:Sheet,i:number)=>`<div class="import-entry"><strong>${escape(s.name)}</strong><div class="import-grid"><label>Classe / agrupamento<select required data-import-origin="${i}">${options(classes(c),s.classId||'','Confirme a origem…')}</select></label>${input(c,`spells.${i}.circle`,'Círculo','number',true,0,9)}${check(c,`spells.${i}.prepared`,'Preparada')}${check(c,`spells.${i}.alwaysPrepared`,'Sempre preparada · característica confirmada')}</div><details ${s.extraSource?'open':''}><summary>Origem especial e usos</summary><div class="import-grid">${input(c,`spells.${i}.extraSource`,'Raça, talento ou característica que concede a magia')}<label>Habilidade da origem<select data-import-field="spells.${i}.castingAbility">${abilityOptions(s.castingAbility||'')}</select></label>${check(c,`spells.${i}.ritual`,'Somente como ritual')}${check(c,`spells.${i}.atWill`,'À vontade · sem espaço')}${input(c,`spells.${i}.limitedUse`,'Usos limitados (vazio se não houver)','number',false,1,100)}${input(c,`spells.${i}.usesUsed`,'Usos já gastos','number',false,0,100)}${input(c,`spells.${i}.customRoll`,'Fórmula personalizada (opcional)')}</div></details></div>`).join('')}</div>${check(c,'rules.importPreparationAdapted','Manter preparo acima do limite · adaptação da mesa')}</details>
    <details><summary>Armas e ataques (${c.weapons.length})</summary><p>Manter manual conserva o ataque/dano do arquivo. Vincular ao catálogo ativa os cálculos da ficha; confira a prévia.</p>${c.weapons.map((w:Sheet,i:number)=>{const catalog=catalogueWeapon(w,E);return `<div class="import-entry"><strong>${escape(w.name)}</strong><label>Cálculo<select data-import-weapon="${i}"><option value="">Manter valores manuais</option>${E.progression.weapons.map((entry:Sheet)=>`<option value="${escape(entry.name)}" ${catalog?.name===entry.name&&w.calculationMode!=='manual'?'selected':''}>${escape(entry.name)}</option>`).join('')}</select></label><div class="import-grid">${input(c,`weapons.${i}.bonus`,'Ataque manual','text',true)}${input(c,`weapons.${i}.damage`,'Dano manual','text',true)}</div><output data-import-weapon-preview="${i}"></output></div>`;}).join('')}</details>
    <details><summary>Textos preservados e origem do arquivo</summary><p>História, aparência, equipamentos, características e ajustes existentes são mantidos. Campos adicionais do PDF ficam nas anotações pessoais, se incluídas.</p>${Object.entries(c.lore).filter(([k])=>["traits","ideals","bonds","flaws","backstory","appearance","allies","treasure"].includes(k)).map(([k,v])=>`<label>${escape({traits:'Personalidade',ideals:'Ideais',bonds:'Ligações',flaws:'Defeitos',backstory:'História',appearance:'Aparência',allies:'Aliados',treasure:'Tesouro'}[k as 'traits']||k)}<textarea rows="2" data-import-field="lore.${k}">${escape(v)}</textarea></label>`).join('')}</details>`;
    for(const n of Array.from({length:9},(_,i)=>i+1))c.standardSlots[n] ||= {total:0,used:0};
    // Os campos ausentes de círculos sem espaços são exibidos como zero, sem
    // apagar as reservas originais ou recalculá-las ao navegar entre fichas.
    body.querySelectorAll<HTMLInputElement>('[data-import-field^="standardSlots."]').forEach(e=>{e.value=String(at(c,e.dataset.importField!)??0);});
    body.querySelectorAll<HTMLSelectElement>('[data-import-subclass]').forEach(e=>{const cls=c.classes[Number(e.dataset.importSubclass)];e.required=cls.level>=(E.data.classes[cls.classId]?.subLevel??99);});
    updatePreviews();updateStatus();
  }
  function updatePreviews() {
    const c=char();body.querySelectorAll<HTMLOutputElement>('[data-import-weapon-preview]').forEach(e=>{const i=Number(e.dataset.importWeaponPreview),w=weaponStats(c,c.weapons[i],E);e.textContent=`${w.calculationMode==='manual'?'Manual':'Catálogo'}: ataque ${w.bonus}; dano ${w.damage}.`;for(const k of ['bonus','damage']){const input=body.querySelector<HTMLInputElement>(`[data-import-field="weapons.${i}.${k}"]`)!;input.disabled=w.calculationMode!=='manual';}});
  }
  controls.querySelector('[data-import-person]')!.addEventListener('change',e=>{current=Number((e.target as HTMLSelectElement).value);error.textContent='';render();});
  ack.addEventListener('change',()=>{if(ack.checked)reviewedManual.add(current);else reviewedManual.delete(current);});
  body.addEventListener('input',e=>{
    const el=(e.target as HTMLElement).closest<HTMLInputElement>('[data-import-field]');if(!el)return;
    const path=el.dataset.importField!,value=el.type==='checkbox'?el.checked:el.type==='number'?el.value===''?undefined:Number(el.value):el.value;
    put(char(),path,value);error.textContent='';updateStatus();updatePreviews();
  });
  body.addEventListener('change',e=>{
    const el=e.target as HTMLSelectElement,c=char();
    if(el.hasAttribute('data-import-field')) {
      const path=el.dataset.importField!;
      if(el.tagName==='SELECT')put(c,path,el.value||undefined);
      const match=path.match(/^classes\.(\d+)\.(classId|level)$/);
      if(match) {
        const cls=c.classes[Number(match[1])],meta=E.data.classes[cls.classId];cls.hitDie=meta?.die||6;
        if(!meta?.subclasses?.[cls.subclassId]){cls.subclassId='';cls.subclass='';}
        const sub=body.querySelector<HTMLSelectElement>(`[data-import-subclass="${match[1]}"]`)!;sub.innerHTML=subclassOptions(cls);sub.required=!!meta&&cls.level>=meta.subLevel;
        body.querySelectorAll<HTMLSelectElement>('[data-import-origin]').forEach(s=>{const spell=c.spells[Number(s.dataset.importOrigin)];s.innerHTML=options(classes(c),spell.classId||'','Confirme a origem…');});
      }
    }
    if(el.hasAttribute('data-import-race')) {c._importManualRace=el.value==='manual';if(c._importManualRace)delete c.rules.raceId;else {c.rules.raceId=el.value;c.race=E.options.races[el.value]?.name||c.race;body.querySelector<HTMLInputElement>('[data-import-field="race"]')!.value=c.race;}}
    if(el.hasAttribute('data-import-subclass')) {const cls=c.classes[Number(el.dataset.importSubclass)];cls._importManualSub=el.value==='manual';cls.subclassId=cls._importManualSub?'':el.value;if(!cls._importManualSub)cls.subclass=E.data.classes[cls.classId]?.subclasses[el.value]?.name||cls.subclass;}
    if(el.hasAttribute('data-import-origin'))c.spells[Number(el.dataset.importOrigin)].classId=el.value;
    if(el.hasAttribute('data-import-weapon')) {const w=c.weapons[Number(el.dataset.importWeapon)];w.calculationMode=el.value?'auto':'manual';if(el.value)w.ruleWeapon=el.value;}
    error.textContent='';updateStatus();updatePreviews();
  });
  body.addEventListener('click',e=>{
    const target=e.target as HTMLElement,c=char();
    if(target.closest('[data-import-add-class]')) {const i=c.classes.length;if(i>=12)return;c.classes.push({classId:'',level:1,subclass:'',subclassId:'',hitDie:6,hitDiceUsed:0});body.querySelector('[data-import-classes]')!.insertAdjacentHTML('beforeend',classRow(c.classes[i],i));body.querySelector<HTMLInputElement>(`[data-import-field="classes.${i}.classId"]`)!.focus();}
    if(target.closest('[data-import-pools]')) {suggestPdfPools(c,E);body.querySelectorAll<HTMLInputElement>('[data-import-field^="standardSlots."],[data-import-field^="pactMagic."],[data-import-field^="sorceryPoints."]').forEach(input=>{const path=input.dataset.importField!;if(path.startsWith('standardSlots.')){const level=path.split('.')[1];c.standardSlots[level]||={total:0,used:0};}input.value=String(at(c,path)??0);});}
  });
  render();
  const dialog=document.getElementById('confirmationDialog') as HTMLDialogElement,form=dialog.querySelector('form')!;
  const validate=(event:SubmitEvent)=>{
    if((event.submitter as HTMLButtonElement)?.value!=='confirm')return;
    try {
      if(!isCurrent())throw new Error('A conta mudou. Reabra a importação no espaço desejado.');
      for(let i=0;i<proposal.characters.length;i++) {
        try {const c=proposal.characters[i] as Sheet;for(const w of c.weapons){if(w.calculationMode!=='manual'&&catalogueWeapon(w,E)&&!w.bonus)w.bonus=weaponStats(c,w,E).bonus;}validateImport(c,E);if(importWarnings(c,E).length&&!reviewedManual.has(i))throw new Error('Confira e aceite os avisos dos itens manuais desta ficha.');}
        catch(e){if(current!==i){current=i;(controls.querySelector('[data-import-person]') as HTMLSelectElement).value=String(i);render();}throw e;}
      }
    }catch(e){event.preventDefault();error.textContent=(e as Error).message;error.scrollIntoView({block:'nearest'});}
  };
  form.addEventListener('submit',validate);dialog.classList.add('import-review-open');
  try {
    const ok=await host.confirmDestructiveAction('Revisar importação','Escolhas não identificadas precisam ser confirmadas. Nada é gravado até importar.','Importar como novas fichas',controls);
    if(!ok)return null;if(!isCurrent())throw new Error('A conta mudou durante a revisão. Nenhuma ficha foi importada.');
    for(const c of proposal.characters as Sheet[]) {
      const pending=importWarnings(c,E),pdfSource=!!c.rules.pdfImport||c.rules.importReview?.source==='pdf';c.rules.importReview={version:1,pending,...pdfSource?{source:'pdf'}:{}};delete c.rules.pdfImport;delete c._importManualRace;for(const cls of c.classes)delete cls._importManualSub;
      for(const s of c.spells)for(const k of ['castingAbility','limitedUse','usesUsed','extraSource'])if(s[k]===undefined||s[k]==='')delete s[k];
    }
    if(!(controls.querySelector('[data-import-notes]') as HTMLInputElement).checked)delete proposal.privateNotes;
    return proposal;
  }finally {form.removeEventListener('submit',validate);dialog.classList.remove('import-review-open');}
}
