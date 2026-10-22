import {escape,type Engine,type Sheet} from '../rules/model';
import {PREPARATION_ADAPTATION_HELP} from '../rules/spell-help';
import {helpAttributes} from '../app/help';
import {preparation,armorProficiencies} from '../rules/spellcasting';
import {catalogueWeapon,weaponStats} from '../rules/combat';
import {proposeImport,importWarnings,importNotices,validateImport,suggestPdfPools,applySuggestedPools} from './character-review';
import {createSpellFields} from '../sheet-edit/spell-fields';
import {classRemovalControls,removeClass} from '../sheet-edit/class-removal';
import {importPoolFields,syncImportPoolDisclosures} from './pool-fields';
import type {Backup} from '../storage/validation';

const host=window as any;
const sectors={identity:'Identidade e classes',combat:'Atributos e combate',skills:'Proficiências',spells:'Grimório',equipment:'Inventário e história'};
type Sector=keyof typeof sectors;
const options=(values:Record<string,Sheet>,selected:string,empty='Escolha…')=>`<option value="">${empty}</option>`+Object.entries(values).map(([id,o])=>`<option value="${escape(id)}" ${id===selected?'selected':''}>${escape(o.name)}</option>`).join('');
const at=(c:Sheet,path:string)=>path.split('.').reduce((v,k)=>v?.[k],c);
function put(c:Sheet,path:string,value:any){const keys=path.split('.'),last=keys.pop()!;let target=c;for(const k of keys)target=target[k];target[last]=value;}
const input=(c:Sheet,path:string,label:string,type='text',required=false,min?:number,max?:number)=>`<label>${label}<input data-import-field="${path}" type="${type}" ${required?'required':''} ${min!==undefined?`min="${min}"`:''} ${max!==undefined?`max="${max}"`:''} ${type==='number'?`step="${path==='speed'?'any':'1'}"`:''} value="${escape(at(c,path)??'')}"></label>`;
const check=(c:Sheet,path:string,label:string,help='')=>`<label class="import-check" ${helpAttributes(label,help)}><input type="checkbox" data-import-field="${path}" ${help?`aria-description="${escape(help)}"`:''} ${at(c,path)?'checked':''}>${label}</label>`;
const card=(title:string,content:string)=>`<section class="import-card"><h3>${title}</h3>${content}</section>`;

/** Só a proposta é editada. Setores conservam seus nós e rascunhos; usam a
 * mesma confirmação, campos de magia e controles da ficha, sem forms aninhados. */
export async function reviewImport(original:Backup,E:Engine,isCurrent:()=>boolean):Promise<Backup|null>{
  if(!original.characters.length)throw new Error('O arquivo não contém personagens.');
  const proposal=proposeImport(original,E),controls=document.createElement('div');controls.className='rule-context import-review';controls.dataset.importReview='';
  let current=0,active:Sector='identity';const reviewedManual=new Set<number>(),positions=new Map<string,number>();
  let spellFields:ReturnType<typeof createSpellFields>[]=[];
  controls.innerHTML=`<label ${proposal.characters.length===1?'hidden':''}>Personagem<select data-import-person>${proposal.characters.map((c,i)=>`<option value="${i}">${escape(c.name||'Sem nome')} (${i+1}/${proposal.characters.length})</option>`).join('')}</select></label><label class="import-mobile-sector">Setor da revisão<select data-import-sector-select>${Object.entries(sectors).map(([id,name],i)=>`<option value="${id}">${i+1}. ${name}</option>`).join('')}</select></label><nav class="import-nav" aria-label="Setores da revisão">${Object.entries(sectors).map(([id,name],i)=>`<button type="button" data-import-sector="${id}" aria-controls="import-panel-${id}">${i+1}. ${name}</button>`).join('')}</nav><div data-import-body data-scroll-content></div><p data-import-error role="alert"></p><div class="import-review-footer"><p data-import-status role="status"></p><label class="import-check"><input type="checkbox" data-import-ack>Conferi os itens mantidos manualmente, indicados em cada setor.</label><label class="import-check"><input type="checkbox" data-import-notes ${proposal.privateNotes?'checked':''} ${proposal.privateNotes?'':'disabled'}>Incluir anotações pessoais${(proposal.characters[0] as Sheet).rules?.pdfImport?' e texto original do PDF':''}</label></div>`;
  const body=controls.querySelector<HTMLElement>('[data-import-body]')!,status=controls.querySelector<HTMLElement>('[data-import-status]')!,error=controls.querySelector<HTMLElement>('[data-import-error]')!,ack=controls.querySelector<HTMLInputElement>('[data-import-ack]')!;
  const char=()=>proposal.characters[current] as Sheet;
  const scroll=()=>controls.closest<HTMLElement>('#confirmationExtra');
  function showSector(id:Sector,remember=true){
    if(remember)positions.set(current+':'+active,scroll()?.scrollTop||0);
    active=id;(controls.querySelector('[data-import-sector-select]') as HTMLSelectElement).value=id;body.querySelectorAll<HTMLElement>('[data-import-panel]').forEach(e=>e.hidden=e.dataset.importPanel!==id);
    controls.querySelectorAll<HTMLElement>('[data-import-sector]').forEach(e=>{const selected=e.dataset.importSector===id;e.setAttribute('aria-current',selected?'step':'false');});
    if(scroll())scroll()!.scrollTop=positions.get(current+':'+id)||0;
  }
  function reveal(el:HTMLElement){const panel=el.closest<HTMLElement>('[data-import-panel]');if(panel)showSector(panel.dataset.importPanel as Sector);for(let parent=el.parentElement;parent&&parent!==body;parent=parent.parentElement)if(parent instanceof HTMLDetailsElement)parent.open=true;}
  function updateStatus(){
    const c=char(),notices=importNotices(c,E);
    for(const id of ['weapons','tools','languages']) {
      const summary=body.querySelector<HTMLElement>(`[data-import-proficiency="${id}"]`);
      if(summary)summary.textContent=c.proficiencies[id] || (id==='weapons'?'Pelas classes, raça e escolhas':'Nenhum registro no arquivo');
    }
    for(const [id] of Object.entries(sectors)){
      const target=body.querySelector<HTMLElement>(`[data-import-notices="${id}"]`),items=notices.filter(n=>n.sector===id);
      if(target){target.hidden=!items.length;target.querySelector('summary')!.textContent=`ⓘ ${items.length} ${items.length===1?'observação':'observações'} para conferir`;
        target.querySelector('[data-import-notice-content]')!.innerHTML=items.map(n=>`<div class="import-notice"><strong>${escape(n.title)}</strong><p>${escape(n.detail)}</p></div>`).join('');}
    }
    const pending=c.spells.filter((s:Sheet)=>!c.classes.some((x:Sheet)=>x.classId===s.classId)).length;
    status.textContent=`${c.name||'Sem nome'} · ${c.classes.length} ${c.classes.length===1?'classe':'classes'} · ${c.spells.length} ${c.spells.length===1?'magia':'magias'}. ${pending?`${pending} ${pending===1?'magia precisa':'magias precisam'} de origem. `:''}${notices.length?`${notices.length} ${notices.length===1?'observação explicada':'observações explicadas'} nos setores.`:'Vínculos prontos para conferir.'}`;
    ack.parentElement!.hidden=!notices.length;ack.checked=reviewedManual.has(current);
    const prep=body.querySelector('[data-import-preparation]');if(prep)prep.textContent=c.classes.filter((x:Sheet)=>E.data.classes[x.classId]).map((x:Sheet)=>{const p=preparation(c,x.classId,E);return p.prepares?`${E.data.classes[x.classId].name}: ${p.used}/${p.limit} preparadas`:'';}).filter(Boolean).join(' · ');
  }
  function subclassOptions(cls:Sheet){const meta=E.data.classes[cls.classId];return options(meta?.subclasses||{},cls.subclassId||'',meta&&cls.level<meta.subLevel?'Ainda sem subclasse':'Escolha a subclasse…')+`<option value="manual" ${cls._importManualSub?'selected':''}>Manter manual / escolher depois</option>`;}
  function classRow(cls:Sheet,i:number){return `<div class="import-class-row" data-import-class-row="${i}"><label>Classe<select required data-import-field="classes.${i}.classId">${options(E.data.classes,cls.classId)}</select></label>${input(char(),`classes.${i}.level`,'Nível','number',true,1,20)}<label>Subclasse<select data-import-subclass="${i}" ${cls.level>=(E.data.classes[cls.classId]?.subLevel??99)?'required':''}>${subclassOptions(cls)}</select></label><button type="button" data-import-remove-class="${i}" ${char().classes.length<2?'disabled title="Adicione outra classe antes de remover a única classe."':''}>Remover classe</button></div>`;}
  function panel(id:Sector,content:string){return `<section id="import-panel-${id}" data-import-panel="${id}" aria-label="${sectors[id]}"><div class="import-sector-title"><h2>${sectors[id]}</h2></div><details class="import-notices" data-import-notices="${id}" hidden><summary></summary><div data-import-notice-content></div></details>${content}</section>`;}
  function proficiencyFields(c:Sheet){
    const names={weapons:'Armas',tools:'Ferramentas',languages:'Idiomas'};
    return `<dl class="import-grid import-proficiency-summary">${Object.entries(names).map(([id,name])=>`<div><dt>${name}</dt><dd data-import-proficiency="${id}"></dd></div>`).join('')}</dl><details data-import-proficiency-edit><summary>Corrigir registros de proficiências e idiomas</summary><p>Opcional. As armas já consideram classe, raça e escolhas no cálculo. Use estes registros para conferir o texto do arquivo ou acrescentar uma proficiência. Ferramentas ficam registradas para consulta.</p><div class="import-grid">${Object.entries(names).map(([id,name])=>input(c,`proficiencies.${id}`,name)).join('')}</div></details>`;
  }
  function weaponFields(c:Sheet){
    return c.weapons.length?c.weapons.map((w:Sheet,i:number)=>{
      const catalog=catalogueWeapon(w,E);
      return `<article class="import-entry import-weapon"><h4>${escape(w.name)}</h4><output data-import-weapon-preview="${i}"></output><details data-import-weapon-edit="${i}"><summary>Corrigir ou vincular arma</summary><label>Como calcular<select data-import-weapon="${i}"><option value="">Usar os valores da ficha</option><optgroup label="Calcular pela arma do catálogo">${E.progression.weapons.map((entry:Sheet)=>`<option value="${escape(entry.name)}" ${catalog?.name===entry.name&&w.calculationMode!=='manual'?'selected':''}>${escape(entry.name)}</option>`).join('')}</optgroup></select></label><div class="import-grid"><label>Bônus de ataque (se houver)<input data-import-field="weapons.${i}.bonus" pattern="[+\\-]?[0-9]+" placeholder="Ex.: +5; pode ficar vazio" value="${escape(w.bonus??'')}"></label>${input(c,`weapons.${i}.damage`,'Dados de dano','text',true)}</div><p class="import-field-help">Ataque é o bônus somado ao d20; dano é a fórmula, como 1d6+3. Não invente um bônus: o arquivo pode não informar, e efeitos como sopros podem usar resistência.</p></details></article>`;
    }).join(''):'<p>Nenhuma arma no arquivo. Você pode adicioná-las depois, diretamente na ficha.</p>';
  }
  function render(){
    const c=char();c.rules ||= {history:[],legacy:true};c.customSkillBonuses ||= {};
    if(!c.classes.length)c.classes.push({classId:'',level:0,subclass:'',subclassId:'',hitDie:6,hitDiceUsed:0});
    for(let n=1;n<=9;n++)c.standardSlots[n] ||= {total:0,used:0};
    if(c.rules.manualMode){c._importManualRace=!c.rules.raceId;for(const cls of c.classes)cls._importManualSub=!cls.subclassId;}
    body.innerHTML=panel('identity',card('Quem é o personagem',`<div class="import-grid">${input(c,'name','Nome','text',true)}${input(c,'playerName','Jogador')}${input(c,'race','Raça / espécie escrita')}<label>Vínculo da raça<select required data-import-race>${options(E.options.races,c.rules.raceId||'','Escolha a raça…')}<option value="manual" ${c._importManualRace?'selected':''}>Personalizada / manter manual</option></select></label>${input(c,'background','Antecedente')}${input(c,'alignment','Tendência')}${input(c,'xp','Experiência','number',false,0)}</div>`)+card('Classes e níveis',`<div data-import-classes>${c.classes.map(classRow).join('')}</div><button type="button" data-import-add-class>+ Adicionar classe</button><div data-import-class-removal></div>`))+
    panel('combat',card('Atributos',`<div class="import-abilities">${Object.entries(E.data.abilities).map(([id,name])=>`<div class="import-stat">${input(c,`abilities.${id}.score`,escape(name),'number',true,0,30)}</div>`).join('')}</div>`)+card('Vida e defesa',`<div class="import-grid import-vitals">${input(c,'hpMax','PV máximos','number',true,1)}${input(c,'hpCurrent','PV atuais','number',true,0)}${input(c,'hpTemp','PV temporários','number',true,0)}${input(c,'baseAcArmor','CA escrita / total manual','number',true,0)}${input(c,'speed','Deslocamento (metros)','number',true,0)}</div>`)+importPoolFields((path,label,min=0,max=100)=>input(c,path,label,'number',true,min,max)))+
    panel('skills',card('Resistências',`<div class="import-saves">${Object.entries(E.data.abilities).map(([id,name])=>check(c,`abilities.${id}.saveProf`,escape(name))).join('')}</div>`)+card('Proficiências e idiomas',`${proficiencyFields(c)}<fieldset><legend>Armaduras</legend><div class="import-saves">${Object.entries({leve:'Leves',media:'Médias',pesada:'Pesadas',escudo:'Escudos'}).map(([id,name])=>`<label class="import-check"><input type="checkbox" data-import-armor="${id}" ${armorProficiencies(c,E).includes(id)?'checked':''}>${name}</label>`).join('')}</div><button type="button" data-import-armor-auto>Usar proficiências da classe e escolhas</button></fieldset>`)+card('Perícias',`<p>Proficiência soma o bônus; especialização dobra esse bônus. O total manual substitui o cálculo. Deixe vazio para calcular automaticamente.</p><div class="import-skill-list"><div class="import-skill-head" aria-hidden="true"><span>Perícia</span><span>Treino</span><span>Total manual</span></div>${Object.entries(E.data.skills).map(([id,name])=>`<div class="import-skill-row"><strong>${escape(name)}</strong><div class="import-skill-training"><label class="import-check"><input type="checkbox" data-import-skill="${id}" ${c.skillsProf.includes(id)?'checked':''}>Proficiente</label><label class="import-check"><input type="checkbox" data-import-expertise="${id}" ${c.expertise.includes(id)?'checked':''}>Especialização</label></div>${input(c,`customSkillBonuses.${id}`,'Total manual','number',false,-1000,1000)}</div>`).join('')}</div>`))+
    panel('spells',`<div class="import-actions"><p data-import-preparation></p><button type="button" data-import-add-spell>+ Adicionar magia</button></div><p>Abra um cartão para corrigir catálogo, origem, preparo ou usos. Você também pode criar uma magia personalizada.</p><div data-import-spells></div><div class="import-preparation-adaptation">${check(c,'rules.importPreparationAdapted','Preparo acima do limite · adaptação da mesa',PREPARATION_ADAPTATION_HELP)}</div>`)+
    panel('equipment',card('Armas e ataques',`<p>Confira ataque e dano. Para alterar ou calcular pelo catálogo, abra “Corrigir ou vincular arma”.</p>${weaponFields(c)}`)+card('História e textos preservados',`<p>Equipamentos, características e demais ajustes existentes serão mantidos. Texto extraído do PDF pode acompanhar as anotações pessoais.</p>${Object.entries(c.lore).filter(([k])=>['traits','ideals','bonds','flaws','backstory','appearance','allies','treasure'].includes(k)).map(([k,v])=>`<details><summary>${escape(({traits:'Personalidade',ideals:'Ideais',bonds:'Ligações',flaws:'Defeitos',backstory:'História',appearance:'Aparência',allies:'Aliados',treasure:'Tesouro'} as any)[k])}</summary><textarea aria-label="${escape(({traits:'Personalidade',ideals:'Ideais',bonds:'Ligações',flaws:'Defeitos',backstory:'História',appearance:'Aparência',allies:'Aliados',treasure:'Tesouro'} as any)[k])}" rows="3" data-import-field="lore.${k}">${escape(v)}</textarea></details>`).join('')}`));
    syncImportPoolDisclosures(body,c,true);renderSpells();updatePreviews();updateStatus();showSector(active,false);
  }
  function spellTitle(article:HTMLElement,s:Sheet){
    article.querySelector('[data-import-spell-title]')!.textContent=s.name||'Nova magia';
    article.querySelector('[data-import-spell-meta]')!.textContent=`${s.circle===0?'Truque':`${s.circle??'?'}º círculo`} · ${E.data.classes[s.classId]?.name||'⚠ Escolha a origem'}${s.extraSource?' · Origem especial':''}`;
  }
  function renderSpells(){
    const c=char(),list=body.querySelector('[data-import-spells]')!;list.replaceChildren();spellFields=[];
    if(!c.spells.length){list.innerHTML='<p class="import-empty">Nenhuma magia. Use Adicionar magia para escolher no catálogo ou criar uma própria.</p>';return;}
    c.spells.forEach((s:Sheet,i:number)=>{
      const article=document.createElement('article');article.className='spell-card import-spell-card';article.dataset.importSpell=String(i);
      article.innerHTML=`<header><div><h3 data-import-spell-title></h3><p data-import-spell-meta></p></div><button type="button" data-import-remove-spell="${i}" aria-label="Remover ${escape(s.name||'nova magia')}">Remover</button></header>${s.importOriginNeedsConfirmation?'<p class="import-notice">⚠ Também pode vir da raça. Confirme a origem e a habilidade; usos raciais precisam de sua característica indicada.</p>':''}<details ${!s.classId||!s.name?'open':''}><summary>Revisar / editar magia</summary></details>`;
      const fields=createSpellFields(c,s,E);spellFields.push(fields);article.querySelector('details')!.append(fields.element);
      fields.element.querySelectorAll<HTMLInputElement>('[data-spell-field]').forEach(el=>{const id=el.dataset.spellField!;if(!['editorMode','castMode'].includes(id))el.dataset.importField=`spells.${i}.${id}`;});
      fields.field('classId').dataset.importOrigin=String(i);fields.field('classId').required=true;
      fields.element.querySelector<HTMLInputElement>('[data-spell-catalog]')!.dataset.importBook=String(i);
      const update=()=>{c.spells[i]=fields.read(true);spellTitle(article,c.spells[i]);updateStatus();};
      fields.element.addEventListener('input',update);fields.element.addEventListener('change',update);
      list.append(article);spellTitle(article,s);
    });
  }
  function updatePreviews(){
    const c=char();body.querySelectorAll<HTMLOutputElement>('[data-import-weapon-preview]').forEach(e=>{const i=Number(e.dataset.importWeaponPreview),w=weaponStats(c,c.weapons[i],E);e.textContent=`Ataque: ${w.bonus||'não informado'} · Dano: ${w.damage} · ${w.calculationMode==='manual'?'Valores da ficha':'Cálculo automático · '+w.ruleWeapon}`;for(const k of ['bonus','damage'])body.querySelector<HTMLInputElement>(`[data-import-field="weapons.${i}.${k}"]`)!.disabled=w.calculationMode!=='manual';});
  }
  function refreshClasses(){
    spellFields.forEach((fields,i)=>{fields.refreshClasses();char().spells[i]=fields.read(true);spellTitle(body.querySelector(`[data-import-spell="${i}"]`)!,char().spells[i]);});updateStatus();
  }
  controls.addEventListener('click',e=>{const tab=(e.target as HTMLElement).closest<HTMLElement>('[data-import-sector]');if(tab)showSector(tab.dataset.importSector as Sector);});
  controls.querySelector('[data-import-sector-select]')!.addEventListener('change',e=>showSector((e.target as HTMLSelectElement).value as Sector));
  controls.querySelector('[data-import-person]')!.addEventListener('change',e=>{current=Number((e.target as HTMLSelectElement).value);error.textContent='';render();});
  ack.addEventListener('change',()=>{if(ack.checked)reviewedManual.add(current);else reviewedManual.delete(current);});
  body.addEventListener('input',e=>{
    const el=e.target as HTMLInputElement;if(el.closest('.spell-fields')||!el.hasAttribute('data-import-field'))return;
    const path=el.dataset.importField!,c=char(),value=el.type==='checkbox'?el.checked:el.type==='number'?el.value===''?undefined:Number(el.value):el.value;
    put(c,path,value);if(/^(classes|standardSlots|pactMagic|sorceryPoints)\./.test(path))body.querySelector('[data-import-pool-comparison]')?.replaceChildren();if(path==='baseAcArmor'&&c.rules.manualMode)c.acFormula='legacy';
    // Correções explícitas não devem desaparecer no próximo refresh do motor.
    const pool=path.match(/^(standardSlots|pactMagic|sorceryPoints)\./);if(pool){c.rules.fieldOverrides ||= {};c.rules.fieldOverrides[pool[1]]=true;syncImportPoolDisclosures(body,c);}
    error.textContent='';updateStatus();updatePreviews();
  });
  body.addEventListener('change',e=>{
    const el=e.target as HTMLSelectElement,c=char();if(el.closest('.spell-fields'))return;
    if(el.hasAttribute('data-import-field')){
      const path=el.dataset.importField!;if(el.tagName==='SELECT')put(c,path,el.value||undefined);
      const match=path.match(/^classes\.(\d+)\.(classId|level)$/);
      if(match){body.querySelector('[data-import-pool-comparison]')?.replaceChildren();const cls=c.classes[Number(match[1])],meta=E.data.classes[cls.classId];cls.hitDie=meta?.die||6;if(!meta?.subclasses?.[cls.subclassId]){cls.subclassId='';cls.subclass='';}const sub=body.querySelector<HTMLSelectElement>(`[data-import-subclass="${match[1]}"]`)!;sub.innerHTML=subclassOptions(cls);sub.required=!!meta&&cls.level>=meta.subLevel;refreshClasses();}
    }
    for(const [key,list] of [['importSkill','skillsProf'],['importExpertise','expertise']])if(el.dataset[key]){const id=el.dataset[key];c[list]=c[list].filter((x:string)=>x!==id);if((el as unknown as HTMLInputElement).checked)c[list].push(id);if(key==='importSkill'&&!(el as unknown as HTMLInputElement).checked){c.expertise=c.expertise.filter((x:string)=>x!==id);body.querySelector<HTMLInputElement>(`[data-import-expertise="${id}"]`)!.checked=false;}if(key==='importExpertise'&&(el as unknown as HTMLInputElement).checked&&!c.skillsProf.includes(id)){c.skillsProf.push(id);body.querySelector<HTMLInputElement>(`[data-import-skill="${id}"]`)!.checked=true;}}
    if(el.hasAttribute('data-import-armor')){const list=armorProficiencies(c,E),id=el.dataset.importArmor!;c.armorProficiencies=list.filter((x:string)=>x!==id);if((el as unknown as HTMLInputElement).checked)c.armorProficiencies.push(id);}
    if(el.hasAttribute('data-import-race')){c._importManualRace=el.value==='manual';if(c._importManualRace)delete c.rules.raceId;else{c.rules.raceId=el.value;c.race=E.options.races[el.value]?.name||c.race;body.querySelector<HTMLInputElement>('[data-import-field="race"]')!.value=c.race;}}
    if(el.hasAttribute('data-import-subclass')){const cls=c.classes[Number(el.dataset.importSubclass)];cls._importManualSub=el.value==='manual';cls.subclassId=cls._importManualSub?'':el.value;if(!cls._importManualSub)cls.subclass=E.data.classes[cls.classId]?.subclasses[el.value]?.name||cls.subclass;}
    if(el.hasAttribute('data-import-weapon')){const w=c.weapons[Number(el.dataset.importWeapon)];w.calculationMode=el.value?'auto':'manual';if(el.value)w.ruleWeapon=el.value;}
    error.textContent='';updateStatus();updatePreviews();
  });
  body.addEventListener('click',e=>{
    const target=e.target as HTMLElement,c=char();
    if(target.closest('[data-import-add-class]')){const i=c.classes.length;if(i>=12)return;c.classes.push({classId:'',level:1,subclass:'',subclassId:'',hitDie:6,hitDiceUsed:0});body.querySelector('[data-import-classes]')!.insertAdjacentHTML('beforeend',classRow(c.classes[i],i));body.querySelectorAll<HTMLButtonElement>('[data-import-remove-class]').forEach(e=>e.disabled=false);body.querySelector<HTMLInputElement>(`[data-import-field="classes.${i}.classId"]`)!.focus();}
    const remove=target.closest<HTMLButtonElement>('[data-import-remove-class]');
    if(remove&&c.classes.length>1){const index=Number(remove.dataset.importRemoveClass),mount=body.querySelector('[data-import-class-removal]')!;
      const apply=(resolution?:Parameters<typeof removeClass>[3])=>{const next=removeClass(c,index,E,resolution);Object.assign(c,next);body.querySelector('[data-import-classes]')!.innerHTML=c.classes.map(classRow).join('');mount.replaceChildren();reviewedManual.delete(current);renderSpells();updateStatus();updatePreviews();body.querySelector('[data-import-pool-comparison]')?.replaceChildren();};
      // Uma classe nova/vazia não possui efeitos; removê-la não pede confirmação.
      if(!c.classes[index].classId)apply();else{mount.replaceChildren(classRemovalControls(c,index,E,apply,()=>mount.replaceChildren()));mount.scrollIntoView({block:'nearest'});}
    }
    if(target.closest('[data-import-armor-auto]')){delete c.armorProficiencies;const list=armorProficiencies(c,E);body.querySelectorAll<HTMLInputElement>('[data-import-armor]').forEach(input=>input.checked=list.includes(input.dataset.importArmor!));}
    if(target.closest('[data-import-add-spell]')){c.spells.push({name:'',circle:0,classId:c.classes[0].classId,extraSource:'Adição livre · adaptação da mesa',castingAbility:E.data.classes[c.classes[0].classId]?.ability||'',prepared:true});renderSpells();const last=body.querySelector<HTMLElement>(`[data-import-spell="${c.spells.length-1}"]`)!;(last.querySelector('details') as HTMLDetailsElement).open=true;last.querySelector<HTMLInputElement>('[data-spell-catalog]')!.focus();updateStatus();}
    const removeSpell=target.closest<HTMLButtonElement>('[data-import-remove-spell]');if(removeSpell){c.spells.splice(Number(removeSpell.dataset.importRemoveSpell),1);renderSpells();updateStatus();body.querySelector<HTMLButtonElement>('[data-import-add-spell]')!.focus({preventScroll:true});}
    if(target.closest('[data-import-pools]')){
      const predicted=structuredClone(c);suggestPdfPools(predicted,E);const rows=[];
      for(let n=1;n<=9;n++)if(c.standardSlots[n]?.total||predicted.standardSlots[n]?.total)rows.push([`${n}º círculo`,c.standardSlots[n]?.total||0,predicted.standardSlots[n]?.total||0]);
      rows.push(['Pacto · círculo',c.pactMagic.level,predicted.pactMagic.level],['Pacto · total',c.pactMagic.total,predicted.pactMagic.total],['Feitiçaria · máximo',c.sorceryPoints.max,predicted.sorceryPoints.max]);
      body.querySelector('[data-import-pool-comparison]')!.innerHTML=`<div class="import-notice"><strong>Máximos pelas classes e níveis atuais</strong><p>Compara Conjuração, Magia de Pacto e Feitiçaria pelas regras de 2014. Não escolhe magias nem recupera usos gastos. Se você mudou classes ou níveis, recalcule a comparação.</p><table><thead><tr><th>Reserva</th><th>Na ficha</th><th>Livro</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>`<${i?'td':'th'}>${escape(v)}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table><button type="button" data-import-apply-pools>Aplicar máximos do livro</button></div>`;
    }
    if(target.closest('[data-import-apply-pools]')){try{Object.assign(c,applySuggestedPools(c,E));body.querySelectorAll<HTMLInputElement>('[data-import-field^="standardSlots."],[data-import-field^="pactMagic."],[data-import-field^="sorceryPoints."]').forEach(el=>el.value=String(at(c,el.dataset.importField!)??0));syncImportPoolDisclosures(body,c);error.textContent='';body.querySelector('[data-import-pool-comparison]')!.innerHTML='<p role="status">Máximos aplicados. Espaços usados e pontos atuais foram mantidos.</p>';}catch(err){error.textContent=(err as Error).message;}}
  });
  render();
  const dialog=document.getElementById('confirmationDialog') as HTMLDialogElement,form=dialog.querySelector('form')!,previousNoValidate=form.noValidate;
  form.noValidate=true; // Primeiro revela o setor do campo inválido, depois pede foco nativo.
  const invalid=(event:Event)=>{const el=event.target as HTMLElement;if(controls.contains(el))reveal(el);};form.addEventListener('invalid',invalid,true);
  const validate=(event:SubmitEvent)=>{
    if((event.submitter as HTMLButtonElement)?.value!=='confirm')return;
    const firstInvalid=controls.querySelector<HTMLInputElement>('input:invalid,select:invalid,textarea:invalid');
    if(firstInvalid){event.preventDefault();reveal(firstInvalid);firstInvalid.reportValidity();return;}
    try{
      if(!isCurrent())throw new Error('A conta mudou. Reabra a importação no espaço desejado.');
      // Releitura estrita cobre rascunhos inválidos sem perder os controles.
      for(let j=0;j<spellFields.length;j++){try{char().spells[j]=spellFields[j].read();}catch(err){reveal(spellFields[j].element);throw err;}}
      for(let i=0;i<proposal.characters.length;i++){
        try{const c=proposal.characters[i] as Sheet;for(const w of c.weapons)if(w.calculationMode!=='manual'&&catalogueWeapon(w,E)&&!w.bonus)w.bonus=weaponStats(c,w,E).bonus;validateImport(c,E);if(importNotices(c,E).length&&!reviewedManual.has(i))throw new Error('Confira as observações nos setores e marque o aceite dos itens mantidos manualmente.');}
        catch(err){if(current!==i){current=i;(controls.querySelector('[data-import-person]') as HTMLSelectElement).value=String(i);render();}const message=(err as Error).message,spell=char().spells.findIndex((s:Sheet)=>s.name&&message.includes(s.name));if(spell>=0)reveal(body.querySelector(`[data-import-spell="${spell}"] .spell-fields`)!);throw err;}
      }
    }catch(err){event.preventDefault();error.textContent=(err as Error).message;error.scrollIntoView({block:'nearest'});}
  };
  form.addEventListener('submit',validate);dialog.classList.add('import-review-open');
  try{
    const ok=await host.confirmDestructiveAction('Revisar importação','Revise por setor. A importação cria cópias; seus originais são preservados.','Importar como novas fichas',controls);
    if(!ok)return null;if(!isCurrent())throw new Error('A conta mudou durante a revisão. Nenhuma ficha foi importada.');
    for(const c of proposal.characters as Sheet[]){const pending=importWarnings(c,E),pdfSource=!!c.rules.pdfImport||c.rules.importReview?.source==='pdf';c.rules.importReview={version:1,pending,...pdfSource?{source:'pdf'}:{}};delete c.rules.pdfImport;delete c._importManualRace;for(const cls of c.classes)delete cls._importManualSub;for(const s of c.spells){delete s.importOriginNeedsConfirmation;for(const k of ['castingAbility','limitedUse','usesUsed','extraSource','castLevel'])if(s[k]===undefined||s[k]==='')delete s[k];}}
    if(!(controls.querySelector('[data-import-notes]') as HTMLInputElement).checked)delete proposal.privateNotes;return proposal;
  }finally{form.noValidate=previousNoValidate;form.removeEventListener('submit',validate);form.removeEventListener('invalid',invalid,true);dialog.classList.remove('import-review-open');}
}
