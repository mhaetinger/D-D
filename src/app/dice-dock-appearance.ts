/** Camada visual do modo selecionado. Não sorteia dados nem altera gestos,
 * posição, pool ou ficha. O arremesso usa o modo escolhido em sheet.js. */
export function updateDiceDockAppearance(mode?:string):void {
  const tray=document.getElementById('dice3dTray')!,dock=document.getElementById('diceDock')!;
  if(mode&&['normal','adv','dis'].includes(mode)&&tray.dataset.rollMode!==mode)tray.dataset.rollMode=mode;
  const selected=tray.dataset.rollMode||'normal',normal=selected==='normal';
  const label=selected==='adv'?'Vantagem':selected==='dis'?'Desvantagem':'Normal';
  const rollLabel=normal?'d20 normal':`d20 com ${label.toLowerCase()}`;
  const marker=document.getElementById('diceDockMode')!,aura=document.getElementById('diceDockAura')!;
  marker.textContent=selected==='adv'?'↑':selected==='dis'?'↓':'';marker.hidden=normal;aura.hidden=normal;
  const result=document.getElementById('diceDockValue')!.textContent;
  dock.setAttribute('aria-label',`${label}. Último resultado: ${result}. Abrir bandeja de dados. Arraste para mover; arremesso e tecla R rolam ${rollLabel}, sem bônus. Setas movem.`);
  dock.title=`${label}. Clique para abrir. Arraste para mover; arremesso e tecla R rolam ${rollLabel}, sem bônus.`;
  const quick=document.getElementById('diceQuickD20')!;
  quick.textContent=`Rolar ${rollLabel}`;
  quick.title='Segue o modo selecionado, sem bônus do pool ou gasto de inspiração.';
}
