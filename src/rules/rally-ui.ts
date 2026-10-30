import {escape,type Engine,type Sheet} from './model';
import {knowsRally,canUseRally,previewRally,applyRally,type RallyChoice} from './rally';
import {superiorityOptions} from './superiority';
import {chooseResourceDice} from './resource-roll-ui';
import {canEditSheet} from '../sheet-edit/access';
import {currentWorkspaceKey} from '../storage/account-scope';

export function rallyControls(c:Sheet,E:Engine,source:string) {
  if(!knowsRally(c,E))return '';
  const text='Inspirar (2014): no seu turno, use ação bônus e um dado desta reserva. Um aliado que possa ver ou ouvir você recebe face + CAR em PV temporários. Não é cura; temporários não se somam. Informe o resultado ao aliado, que escolhe manter os atuais ou receber os novos. Turno, ação e percepção ficam com a mesa. Forma Selvagem continua manual.';
  return `<button type="button" data-rule-action="rally" data-resource="${source}" data-rule-tooltip="${escape(JSON.stringify({name:'Inspirar · ação bônus',text}))}" ${!canEditSheet(c) || !canUseRally(c,E,source)?'disabled':''}>Inspirar</button><output role="status" data-rally-result="${source}" hidden></output>`;
}
const pending=new WeakSet<Sheet>();
export async function useRally(c:Sheet,E:Engine,trigger:HTMLButtonElement,save:(description:string)=>void) {
  if(pending.has(c))return;
  pending.add(c);
  try{
    const host=window as any,workspace=currentWorkspaceKey(),before=JSON.stringify(c),id=trigger.dataset.resource!;
    const valid=()=>host.getChar()===c && currentWorkspaceKey()===workspace && JSON.stringify(c)===before && trigger.isConnected && trigger.dataset.resource===id && canEditSheet(c);
    if(!valid() || !canUseRally(c,E,id))throw new Error('Inspirar indisponível. Confira conhecimento, reserva, condição e permissão.');
    const source=superiorityOptions(c,E).find(s=>s.id===id)!,fields=document.createElement('div');fields.className='rule-dialog-fields';
    fields.innerHTML='<label>Aliado que recebe os PV temporários <input type="text" maxlength="80" required data-rally-ally autocomplete="off" placeholder="Nome ou identificação na mesa"></label><label class="rule-check"><input type="checkbox" required data-rally-declared> É meu turno, tenho ação bônus disponível e o aliado pode me ver ou ouvir</label>';
    const choice=(face:number):RallyChoice=>({source:id,face,ally:fields.querySelector<HTMLInputElement>('[data-rally-ally]')!.value,declared:fields.querySelector<HTMLInputElement>('[data-rally-declared]')!.checked});
    // A escolha contextual também é validada antes de qualquer RNG, sem
    // gastar para visualizar, cancelar ou rejeitar uma ficha desatualizada.
    const faces=await chooseResourceDice(c,'Inspirar · ação bônus',source.die,1,{
      fields,
      message:`${source.name} · 1d${source.die} + CAR. Gasta 1 dado ao confirmar. Informe o total ao aliado: PV temporários não se somam, não curam nem estabilizam. Duram até acabar ou o aliado concluir descanso longo.`,
      acceptLabel:'Gastar dado e inspirar',
      valid:()=>{if(!valid())return false;previewRally(c,choice(1),E);return true;},
    });
    if(!faces)return;
    if(!valid())throw new Error('A ficha, a conta ou a permissão mudou. Inspirar não foi aplicado.');
    const result=applyRally(c,choice(faces[0]),E),modifier=`${result.cha>=0?'+':''}${result.cha}`;
    save(`Inspirar · ação bônus no próprio turno · ${result.source.name} d${result.source.die}[${result.face}] + CAR (${modifier}) = ${result.temporary} PV temporários para ${result.ally} · gastou 1 dado · aliado aplica na mesa, sem somar temporários`);
    for(const output of document.querySelectorAll<HTMLOutputElement>(`[data-rally-result="${id}"]`)){
      output.hidden=false;output.textContent=`${result.ally}: ${result.temporary} PV temporários (${result.face} + CAR ${modifier}). Informe ao aliado; não somam aos atuais.`;
    }
  }finally{pending.delete(c);}
}
