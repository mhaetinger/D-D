import {escape,type Sheet} from '../rules/model';

const host=window as any;

/** A regra consultada por hover e por toque tem a mesma origem e escolhas.
 * O botão de consulta fica separado das ações de gastar/ativar o recurso. */
export function featureConsultButton(gain:Sheet,key:string,group:string,fallback:string):string {
  const ref=gain.reference;
  const text=[gain.source&&gain.source!==group?`Origem: ${gain.source}`:'',gain.choices?.length?`Escolhas: ${gain.choices.join(' · ')}`:'',host.RuleTooltips.formatText(ref?.text||fallback||'Consulte a seção desta classe no livro.')].filter(Boolean).join('\n\n');
  const info=escape(JSON.stringify({name:gain.name,text,page:ref?.page,pdfPage:ref?.pdfPage}));
  return `<button type="button" class="feature-consult" data-feature-consult="${escape(key)}" data-rule-tooltip="${info}" aria-haspopup="dialog" aria-expanded="false" aria-label="Consultar ${escape(gain.name)}"><strong>${escape(gain.name)}</strong></button>`;
}

/** O livro usa a mesma ajuda/consulta das características: um único balão no
 * hover e abertura explícita por teclado/toque, com o link do PDF dentro. */
export function bookConsultButton(name:string,ref:Sheet,key:string):string {
  const info=escape(JSON.stringify({name,...ref}));
  return `<button type="button" class="spell-book-consult" data-feature-consult="${escape(key)}" data-rule-tooltip="${info}" aria-haspopup="dialog" aria-expanded="false" aria-label="Consultar descrição de ${escape(name)}"><i data-lucide="book-open" aria-hidden="true"></i></button>`;
}

export function setupFeatureConsultation():void {
  const pop=document.createElement('div');pop.id='featureConsultation';pop.className='rule-tooltip feature-consultation';
  pop.setAttribute('popover','auto');pop.setAttribute('role','dialog');pop.setAttribute('aria-labelledby','featureConsultTitle');pop.setAttribute('data-scroll-window','');
  document.body.append(pop);
  let trigger:HTMLButtonElement|null=null;
  const close=(restore=false)=>{const previous=trigger;if(pop.matches(':popover-open'))pop.hidePopover();previous?.setAttribute('aria-expanded','false');trigger=null;if(restore&&previous?.isConnected){previous.focus({preventScroll:true});host.RuleTooltips.hide();}};
  pop.addEventListener('toggle',()=>{if(!pop.matches(':popover-open')){trigger?.setAttribute('aria-expanded','false');trigger=null;}});
  const position=()=>{if(trigger)host.positionTooltip({currentTarget:trigger},pop.id);};
  document.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-feature-consult]');if(!button)return;
    if(trigger===button&&pop.matches(':popover-open')){close(true);return;}
    let info:Sheet;try{info=JSON.parse(button.dataset.ruleTooltip||'');}catch{return;}
    close();host.RuleTooltips.claim('featureConsultation');trigger=button;
    const heading=document.createElement('strong'),text=document.createElement('p'),dismiss=document.createElement('button');
    heading.id='featureConsultTitle';heading.textContent=info.name;text.textContent=info.text;
    dismiss.type='button';dismiss.className='feature-consult-close';dismiss.textContent='×';dismiss.setAttribute('aria-label','Fechar consulta');dismiss.addEventListener('click',()=>close(true));
    pop.replaceChildren(dismiss,heading,text);
    if(Number.isInteger(info.pdfPage)&&info.pdfPage>0&&info.pdfPage<=1000){const link=document.createElement('a');link.textContent=`Consultar no livro · p. ${info.page||info.pdfPage}`;link.href=`book.html#page=${info.pdfPage}`;link.target='_blank';link.rel='noopener';pop.append(link);}
    // Consultas de uma revisão modal ficam dentro dela, fora da região inerte
    // da página de trás. O mesmo balão atende a ficha e a importação.
    (button.closest('dialog')||document.body).append(pop);
    pop.showPopover();button.setAttribute('aria-expanded','true');pop.scrollTop=0;position();dismiss.focus({preventScroll:true});
  });
  pop.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}});
  // Uma troca de ficha/aba/conta encerra a consulta do nó antigo.
  const observer=new MutationObserver(()=>{if(trigger&&!trigger.isConnected)close();});
  observer.observe(document.getElementById('sheetViewport')!,{childList:true,subtree:true});
  observer.observe(document.getElementById('confirmationExtra')!,{childList:true,subtree:true});
  document.addEventListener('close',event=>{if(trigger&&event.target instanceof HTMLDialogElement&&event.target.contains(trigger))close();},true);
  window.addEventListener('resize',()=>close());window.addEventListener('dnd-workspace-changed',()=>close());
  window.addEventListener('critcall-tooltip-request',event=>{if((event as CustomEvent).detail?.owner!=='featureConsultation')close();});
  document.addEventListener('scroll',event=>{if(pop.matches(':popover-open')&&event.target!==pop)position();},true);
}
