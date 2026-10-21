import {escape,type Sheet,type Engine} from '../rules/model';
export type ClassRemoval={spells:'keep'|'remove';group?:string};
/** Remover a classe não reconstrói atributos, PV, escolhas ou histórico.
 * Manter suas magias é uma adaptação explícita, com habilidade anterior fixa;
 * agrupamento e origem continuam sendo informações distintas. */
export function removeClass(c:Sheet,index:number,E:Engine,resolution?:ClassRemoval):Sheet {
  if(c.classes.length<2)throw new Error('Mantenha ao menos uma classe. Para trocar a única classe, adicione a nova primeiro.');
  const copy=structuredClone(c),cls=copy.classes[index];if(!cls)throw new Error('Classe desconhecida.');
  const bound=copy.spells.filter((s:Sheet)=>s.classId===cls.classId);
  if(bound.length&&!resolution)throw new Error('Escolha o que fazer com as magias vinculadas antes de remover a classe.');
  if(bound.length&&resolution?.spells==='keep'){
    if(!copy.classes.some((x:Sheet,i:number)=>i!==index&&x.classId===resolution.group))throw new Error('Escolha uma classe restante para agrupar as magias.');
    for(const s of bound){const ability=s.castingAbility||E.data.classes[cls.classId]?.ability;if(!ability)throw new Error(`Informe a habilidade de ${s.name} antes de remover a classe.`);s.castingAbility=ability;s.extraSource=[s.extraSource,`Classe anterior: ${E.data.classes[cls.classId]?.name||cls.classId} · adaptação da mesa`].filter(Boolean).join(' · ');s.classId=resolution.group;}
  }else if(resolution?.spells==='remove')copy.spells=copy.spells.filter((s:Sheet)=>s.classId!==cls.classId);
  copy.classes.splice(index,1);
  for(const key of Object.keys(copy.ruleState?.active||{}))if(key.startsWith(cls.classId+':'))copy.ruleState.active[key]=false;
  // Reservas existentes não viram uma recuperação nem desaparecem nesta ação.
  copy.rules ||= {history:[]};copy.rules.fieldOverrides ||= {};
  for(const key of ['hpMax','speed','standardSlots','pactMagic','sorceryPoints'])copy.rules.fieldOverrides[key]=true;
  return copy;
}
export function classRemovalControls(c:Sheet,index:number,E:Engine,apply:(resolution:ClassRemoval)=>void,cancel:()=>void):HTMLElement {
  const node=document.createElement('section');node.className='rule-context import-review sheet-inline-editor class-removal';node.dataset.classRemoval='';
  const cls=c.classes[index],bound=c.spells.filter((s:Sheet)=>s.classId===cls.classId);
  const expected=JSON.stringify({classes:c.classes,spells:bound});
  node.innerHTML=`<h4>Remover ${escape(E.data.classes[cls.classId]?.name||cls.classId)}?</h4><p>Atributos, PV, reservas, textos e histórico serão mantidos. Escolhas e efeitos ativos da classe removida deixam de conceder bônus automáticos. Confira os recursos e máximos depois: esta é uma correção livre, sem recalcular a ficha.</p>${bound.length?`<p><strong>${bound.length} ${bound.length===1?'magia vinculada':'magias vinculadas'}:</strong> ${bound.map((s:Sheet)=>escape(s.name)).join(', ')}.</p><label>O que fazer com essas magias?<select data-class-removal-mode><option value="">Escolha…</option><option value="keep">Manter como adaptação da mesa</option><option value="remove">Remover também essas magias</option></select></label><label data-class-removal-group-label hidden>Agrupar em<select data-class-removal-group>${c.classes.filter((_:Sheet,i:number)=>i!==index).map((x:Sheet)=>`<option value="${escape(x.classId)}">${escape(E.data.classes[x.classId]?.name||x.classId)}</option>`).join('')}</select></label><p data-class-removal-help hidden>A origem anterior e a habilidade ficam registradas. Formas de lançamento e usos são preservados; confira o recurso a gastar antes de conjurar.</p>`:''}<p data-class-removal-error role="alert"></p><div class="import-actions"><button type="button" data-class-removal-cancel>Cancelar</button><button type="button" data-class-removal-apply ${bound.length?'disabled':''}>Confirmar remoção</button></div>`;
  const mode=node.querySelector<HTMLSelectElement>('[data-class-removal-mode]'),button=node.querySelector<HTMLButtonElement>('[data-class-removal-apply]')!;
  mode?.addEventListener('change',()=>{button.disabled=!mode.value;for(const key of ['group-label','help'])node.querySelector<HTMLElement>(`[data-class-removal-${key}]`)!.hidden=mode.value!=='keep';});
  button.addEventListener('click',()=>{try{if(JSON.stringify({classes:c.classes,spells:c.spells.filter((s:Sheet)=>s.classId===cls.classId)})!==expected)throw new Error('As classes ou magias vinculadas mudaram. Cancele e confira a remoção novamente.');apply({spells:mode?.value==='remove'?'remove':'keep',group:node.querySelector<HTMLSelectElement>('[data-class-removal-group]')?.value});}catch(e){node.querySelector('[data-class-removal-error]')!.textContent=(e as Error).message;}});
  node.querySelector('[data-class-removal-cancel]')!.addEventListener('click',cancel);
  return node;
}
