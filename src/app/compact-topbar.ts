/** Preferências ficam à vista no desktop e recolhidas no celular. A troca de
 * largura não recria controles nem altera preferências, foco ou dados da ficha. */
export function setupCompactTopbar():void {
  const details=document.querySelector<HTMLDetailsElement>('.app-preferences');
  if(!details)return;
  const mobile=matchMedia('(max-width:639px)');
  const update=()=>{
    // Abrir antes de ampliar evita esconder um controle que esteja com foco.
    if(!mobile.matches)details.open=true;
    else if(!details.contains(document.activeElement))details.open=false;
  };
  update();mobile.addEventListener('change',update);
}
