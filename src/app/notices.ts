let timer:ReturnType<typeof setTimeout>|undefined;
let cleanup=()=>{};

/** Avisos acompanham a janela em uso, inclusive a camada nativa dos diálogos.
 * Não recebem foco nem remontam listas; a ficha usa o toast de sempre. */
export function showNotice(message:string):void {
  clearTimeout(timer);cleanup();
  const global=document.getElementById('toast')!;
  global.classList.add('hidden');
  const visible=(el:HTMLElement)=>el.getClientRects().length>0;
  const focused=document.activeElement as HTMLElement|null;
  const dialogs=[...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].filter(visible);
  const windows=[...document.querySelectorAll<HTMLElement>('[data-notice-window]')].filter(visible);
  const owner=dialogs.find(el=>el.contains(focused)) || dialogs.at(-1)
    || windows.find(el=>el.contains(focused)) || windows.at(-1);
  if(!owner){
    global.textContent=message;global.classList.remove('hidden');
    timer=setTimeout(()=>global.classList.add('hidden'),3500);cleanup=()=>{};return;
  }
  let region=owner.querySelector<HTMLElement>('[data-window-notice]');
  if(!region){
    region=document.createElement('p');region.dataset.windowNotice='';
    region.className='window-notice';region.setAttribute('role','status');region.setAttribute('aria-live','polite');region.setAttribute('aria-atomic','true');
    (owner.querySelector('form') || owner).append(region);
  }
  region.textContent=message;region.hidden=false;
  const notice=region;
  const hide=()=>{notice.hidden=true;observer.disconnect();owner.removeEventListener('close',hide);};
  const observer=new MutationObserver(()=>{if(!visible(owner))hide();});
  observer.observe(owner,{attributes:true,attributeFilter:['class','open','hidden']});
  owner.addEventListener('close',hide);
  cleanup=hide;timer=setTimeout(hide,6000);
}
