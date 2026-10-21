/** Camada visual do modo selecionado. Não sorteia dados nem altera gestos,
 * posição, pool ou ficha. O arremesso rápido continua sendo um d20 normal. */
export function updateDiceDockAppearance(mode?:string):void {
  const tray=document.getElementById('dice3dTray')!,dock=document.getElementById('diceDock')!;
  if(mode&&['normal','adv','dis'].includes(mode)&&tray.dataset.rollMode!==mode)tray.dataset.rollMode=mode;
  const selected=tray.dataset.rollMode||'normal',normal=selected==='normal';
  const label=selected==='adv'?'Vantagem':selected==='dis'?'Desvantagem':'Normal';
  const marker=document.getElementById('diceDockMode')!,aura=document.getElementById('diceDockAura')!;
  marker.textContent=selected==='adv'?'↑':selected==='dis'?'↓':'';marker.hidden=normal;aura.hidden=normal;
  const result=document.getElementById('diceDockValue')!.textContent;
  dock.setAttribute('aria-label',`${label}. Último resultado: ${result}. Abrir bandeja de dados. Arraste para mover; arremesso e tecla R rolam d20 normal. Setas movem.`);
  dock.title=`${normal?'Normal':label+' selecionada para ficha e bandeja'}. Clique para abrir. Arraste para mover; arremesso e tecla R rolam d20 normal.`;
}
