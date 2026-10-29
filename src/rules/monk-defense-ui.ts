import {level,type Engine,type Sheet} from './model';
import {monkAction} from './monk';
import {heavyArmorReduction,previewTypedDamage,type DamagePacket} from './damage';
import {chooseResourceDice} from './resource-roll-ui';
import {currentWorkspaceKey} from '../storage/account-scope';
import {canEditSheet} from '../sheet-edit/access';

export function monkDefenseControls(c:Sheet) {
  if(level(c,'monge')<3)return '';
  return `<details class="rule-context" data-monk-defense-controls hidden><summary>Defesas do monge · reação</summary><label>Defesa <select data-monk-defense><option value="">Sem defesa de monge</option><option value="projectile">Defletir Projéteis · ataque de arma à distância</option>${level(c,'monge')>=4?'<option value="fall">Queda Lenta · dano da própria queda</option>':''}</select></label><div class="rule-dialog-fields" data-monk-defense-fields hidden><label class="rule-check"><input type="checkbox" data-monk-defense-declared> O gatilho acima ocorreu e tenho reação disponível</label><label data-monk-defense-face-label>Face do d10 <input type="number" min="1" max="10" step="1" data-monk-defense-face></label><button type="button" data-monk-defense-roll>Rolar ou informar d10</button><label class="rule-check" data-monk-defense-catch-label><input type="checkbox" data-monk-defense-catch> Apanhar: dano reduzido a zero, projétil cabe em uma mão e tenho mão livre</label><label data-monk-defense-order-label hidden>Ordem definida pela mesa <select data-monk-defense-order><option value="armorFirst">Armadura → monge</option><option value="monkFirst">Monge → armadura</option></select></label><p>Defletir: 1d10 + DES + nível de monge. Queda Lenta: 5 × nível de monge. Não gastam Chi; não use outra reação. Para devolver um projétil apanhado, use Devolver projétil na característica e gaste 1 Chi, na mesma reação. Não é o Defletir Ataques de 2024.</p></div></details>`;
}
export function readMonkDefense(root:HTMLElement):Pick<DamagePacket,'monkDefense'|'monkOrder'> {
  const kind=root.querySelector<HTMLSelectElement>('[data-monk-defense]')?.value;if(!kind)return {};
  return {monkDefense:{kind:kind as 'projectile'|'fall',face:Number(root.querySelector<HTMLInputElement>('[data-monk-defense-face]')!.value),declared:root.querySelector<HTMLInputElement>('[data-monk-defense-declared]')!.checked,catch:kind==='projectile' && root.querySelector<HTMLInputElement>('[data-monk-defense-catch]')!.checked},monkOrder:root.querySelector<HTMLSelectElement>('[data-monk-defense-order]')!.value as DamagePacket['monkOrder']};
}
export function updateMonkDefense(root:HTMLElement,c:Sheet,E:Engine) {
  const panel=root.querySelector<HTMLElement>('[data-monk-defense-controls]');if(!panel)return;
  const source=root.querySelector<HTMLSelectElement>('[data-damage-source]')!.value,select=panel.querySelector<HTMLSelectElement>('[data-monk-defense]')!;
  let allowed=true;try{monkAction(c,3);}catch{allowed=false;}
  const projectile=allowed && ['weapon','magicWeapon'].includes(source),fall=allowed && source==='other' && level(c,'monge')>=4;
  panel.hidden=!projectile && !fall;
  for(const option of select.options)option.disabled=option.value==='projectile'?!projectile:option.value==='fall'?!fall:false;
  if(select.selectedOptions[0]?.disabled)select.value='';
  panel.querySelector<HTMLElement>('[data-monk-defense-fields]')!.hidden=!select.value;
  for(const attr of ['face-label','roll','catch-label'])panel.querySelector<HTMLElement>(`[data-monk-defense-${attr}]`)!.hidden=select.value!=='projectile';
  panel.querySelector<HTMLElement>('[data-monk-defense-order-label]')!.hidden=!heavyArmorReduction(c,E,source);
}
const pending=new WeakSet<HTMLElement>();
export async function prepareMonkDefense(root:HTMLElement,E:Engine,packet:()=>DamagePacket) {
  if(pending.has(root))return;pending.add(root);
  try{
    const host=window as any,c=host.getChar(),before=JSON.stringify(c),scope=currentWorkspaceKey(),settings=host.ruleDiceSettings();
    const values=()=>JSON.stringify([...root.querySelectorAll<HTMLInputElement|HTMLSelectElement>('input,select')].map(x=>[x.value,'checked' in x?x.checked:null])),fields=values();
    const valid=()=>root.isConnected && host.getChar()===c && currentWorkspaceKey()===scope && canEditSheet(c) && JSON.stringify(c)===before && fields===values() && root.querySelector<HTMLSelectElement>('[data-damage-mode]')!.value==='typed';
    const choice=packet();if(!choice.monkDefense || choice.monkDefense.kind!=='projectile')throw new Error('Escolha Defletir Projéteis.');
    previewTypedDamage(c,{...choice,monkDefense:{...choice.monkDefense,face:1,catch:false}},E);
    const faces=await chooseResourceDice(c,'Defletir Projéteis · preparar d10',10,1,{valid:()=>valid() && JSON.stringify(host.ruleDiceSettings())===JSON.stringify(settings),message:'Somente prepara a face para a prévia. Não gasta Chi ou reação nem desconta PV; confirme a ocorrência em Aplicar dano.',acceptLabel:'Preencher d10'});if(!faces)return;
    if(!valid())throw new Error('A ficha ou a ocorrência mudou; nenhuma redução foi aplicada.');
    root.querySelector<HTMLInputElement>('[data-monk-defense-face]')!.value=String(faces[0]);root.dispatchEvent(new Event('input',{bubbles:true}));
  }finally{pending.delete(root);}
}
