import {chooseDieSource,dieSourceControls} from './health-ui';
import type {Sheet} from './model';

const pending=new WeakSet<Sheet>();
/** Reutiliza a escolha físico/virtual. Só retorna faces validadas; o chamador
 * revalida a reserva e aplica gasto/efeito depois. Cancelar não altera a ficha. */
export async function chooseResourceDice(c:Sheet,title:string,sides:number,count=1):Promise<number[]|null> {
  if(pending.has(c))return null;
  pending.add(c);
  try {
    const host=window as any,before=JSON.stringify(c),controls=document.createElement('div');
    controls.className='rule-context rule-dialog-fields';
    controls.innerHTML=dieSourceControls(sides,false);
    if(count>1){
      const fields=document.createElement('div');fields.setAttribute('data-health-face-label','');fields.className='rule-dialog-fields';
      fields.innerHTML=Array.from({length:count},(_,i)=>`<label>Dado ${i+1} · face do d${sides} <input type="number" min="1" max="${sides}" step="1" data-resource-die ${i===0?'data-health-face':''}></label>`).join('');
      controls.querySelector('[data-health-face-label]')!.replaceWith(fields);
    }
    chooseDieSource(controls);
    const updateFaces=()=>{
      const virtual=controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual';
      for(const field of controls.querySelectorAll<HTMLInputElement>('[data-resource-die]')){field.disabled=virtual;field.required=!virtual;}
    };
    controls.addEventListener('change',updateFaces);updateFaces();
    if(!await host.confirmDestructiveAction(title,`Registre ${count}d${sides} físico${count>1?'s':''} ou escolha rolar aqui. O recurso só é gasto ao aplicar o resultado.`,'Aplicar resultado',controls))return null;
    if(host.getChar()!==c || JSON.stringify(c)!==before)throw new Error('A ficha mudou durante a escolha. Nenhum uso foi aplicado; confira e tente novamente.');
    const virtual=controls.querySelector<HTMLSelectElement>('[data-health-source]')!.value==='virtual';
    if(virtual && !host.ruleDiceSettings().enabled)throw new Error('Os dados virtuais estão desligados. Registre o resultado físico.');
    const fields=[...controls.querySelectorAll<HTMLInputElement>(count>1?'[data-resource-die]':'[data-health-face]')];
    if(!virtual && fields.some(field=>!field.value.trim() || !Number.isInteger(Number(field.value)) || Number(field.value)<1 || Number(field.value)>sides))throw new Error(`Informe cada face do d${sides}, entre 1 e ${sides}.`);
    return virtual?Array.from({length:count},()=>host.rollRuleDie(sides,title,'normal')):fields.map(field=>Number(field.value));
  } finally {pending.delete(c);}
}
