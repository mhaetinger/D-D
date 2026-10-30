import {type Engine,type Sheet} from './model';
import {canStartEvasiveFootwork,evasiveFootworkBonus,finishEvasiveFootwork,knowsEvasiveFootwork,previewEvasiveFootwork,startEvasiveFootwork} from './evasive-footwork';
import {readEvasiveFootwork} from './evasive-footwork-state';
import {superiorityOptions} from './superiority';
import {chooseResourceDice} from './resource-roll-ui';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';

export function evasiveStartControl(c:Sheet,E:Engine,source:string) {
  if(!knowsEvasiveFootwork(c,E))return '';
  return `<button type="button" data-rule-action="evasiveStart" data-resource="${source}" ${!canEditSheet(c) || !canStartEvasiveFootwork(c,E,source)?'disabled':''}>Passo Evasivo</button>`;
}
export function evasiveDefenseControls(c:Sheet,E:Engine) {
  if(c.ruleState?.evasiveFootwork===undefined)return '';
  const effect=readEvasiveFootwork(c),bonus=evasiveFootworkBonus(c,E);
  if(!effect)return '<p role="status" class="rule-context">Passo Evasivo: registro ilegível preservado, sem bônus de CA. Confira o backup.</p>';
  return `<div class="rule-context rule-controls" data-evasive-control tabindex="-1"><strong>Passo Evasivo · ${bonus?`+${bonus} CA`:'sem bônus neste contexto'}</strong><span>Até parar de se mover</span><button type="button" data-rule-action="evasiveEnd" ${!canEditSheet(c)?'disabled':''}>Terminei de me mover</button></div>`;
}
const pending=new WeakSet<Sheet>();
export async function useEvasiveFootwork(c:Sheet,E:Engine,trigger:HTMLButtonElement,save:(description:string)=>void) {
  if(pending.has(c))return;
  pending.add(c);
  try{
    const host=window as any,workspace=currentWorkspaceKey(),before=JSON.stringify(c),id=trigger.dataset.resource!;
    const valid=()=>host.getChar()===c && currentWorkspaceKey()===workspace && JSON.stringify(c)===before && trigger.isConnected && trigger.dataset.resource===id && canEditSheet(c);
    if(!valid() || !canStartEvasiveFootwork(c,E,id))throw new Error('Passo Evasivo indisponível. Confira movimento, conhecimento, reserva e permissão.');
    const source=superiorityOptions(c,E).find(s=>s.id===id)!,fields=document.createElement('div');fields.className='rule-dialog-fields';
    fields.innerHTML='<label class="rule-check"><input type="checkbox" required data-evasive-moving> Estou me movendo; vou encerrar o bônus assim que parar, mesmo dentro deste turno</label>';
    const choice=(face:number)=>({source:id,face,moving:fields.querySelector<HTMLInputElement>('[data-evasive-moving]')!.checked});
    const faces=await chooseResourceDice(c,'Passo Evasivo · durante o movimento',source.die,1,{
      fields,message:`${source.name} · gasta 1d${source.die} e soma a face à CA até parar de se mover. Não exige ação bônus nem reação. O aplicativo não acompanha distância ou pausas: use Terminei de me mover junto à CA assim que parar.`,acceptLabel:'Gastar dado e iniciar',
      valid:()=>{if(!valid())return false;previewEvasiveFootwork(c,choice(1),E);return true;},
    });
    if(!faces)return;
    if(!valid())throw new Error('A ficha, a conta ou a permissão mudou. Passo Evasivo não foi aplicado.');
    const result=startEvasiveFootwork(c,choice(faces[0]),E);
    save(`Passo Evasivo · ${result.source.name} d${result.source.die}[${result.face}] · +${result.face} CA até parar de se mover · gastou 1 dado; movimento declarado pela mesa`);
    document.querySelector<HTMLElement>('[data-evasive-control]')?.focus({preventScroll:false});
  }finally{pending.delete(c);}
}
export function endEvasiveMovement(c:Sheet,save:(description:string)=>void) {
  if(!canEditSheet(c))throw new Error('Sem permissão para alterar esta ficha.');
  const effect=finishEvasiveFootwork(c);
  save(`Passo Evasivo · terminou de se mover · encerrou +${effect.face} CA, sem devolver o dado`);
  document.querySelector<HTMLElement>('[data-rule-disclosure="defense"] > summary')?.focus({preventScroll:true});
}
