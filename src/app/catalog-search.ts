import {norm} from '../rules/model';

/** Busca local com escolha explícita. Mantém foco no input e o texto digitado
 * até selecionar; não usa a janela nativa de datalist, fora do tema/diálogo.
 * Teclado segue o combobox da WAI: setas, Enter e Esc, sem capturar digitação. */
export function catalogSearch(input:HTMLInputElement,entries:{name:string;detail:string}[]) {
  const root=input.closest<HTMLElement>('[data-spell-catalog-label]')!;
  const list=document.createElement('div');list.className='catalog-results';list.id='catalog-results-'+crypto.randomUUID();list.hidden=true;
  list.setAttribute('role','listbox');list.setAttribute('aria-label','Resultados do catálogo');list.setAttribute('data-scroll-window','');root.append(list);
  input.autocomplete='off';input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');input.setAttribute('aria-controls',list.id);
  let matches:typeof entries=[],active=-1;
  const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;};
  const mark=(index:number)=>{active=index;[...list.children].forEach((el,i)=>el.setAttribute('aria-selected',String(i===index)));const option=list.children[index] as HTMLElement;if(option){input.setAttribute('aria-activedescendant',option.id);option.scrollIntoView({block:'nearest'});}};
  const show=()=>{
    const query=norm(input.value);matches=entries.filter(e=>!query||norm(e.name).includes(query)).slice(0,30);active=-1;
    list.replaceChildren();input.removeAttribute('aria-activedescendant');
    for(const [i,entry] of matches.entries()){
      const option=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('span');
      option.id=list.id+'-'+i;option.dataset.catalogOption=entry.name;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.tabIndex=-1;
      name.textContent=entry.name;detail.textContent=entry.detail;option.append(name,detail);
      option.addEventListener('mousedown',e=>e.preventDefault());
      option.addEventListener('click',()=>{input.value=entry.name;close();input.focus({preventScroll:true});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));close();});list.append(option);
    }
    if(!matches.length){const empty=document.createElement('p');empty.textContent='Nenhuma correspondência. Para um efeito próprio, escolha Criar truque ou magia.';list.append(empty);}
    list.hidden=false;input.setAttribute('aria-expanded','true');
  };
  input.addEventListener('input',()=>{input.setCustomValidity('');show();});input.addEventListener('focus',show);input.addEventListener('click',()=>{if(list.hidden)show();});
  input.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!list.hidden){e.preventDefault();e.stopPropagation();close();}
    else if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(list.hidden)show();if(matches.length)mark(active<0?(e.key==='ArrowDown'?0:matches.length-1):(active+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length);}
    else if(e.key==='Enter'&&!list.hidden){
      // Consultar o catálogo não confirma a importação inteira. Sem destaque,
      // só um nome completo é aceito; a busca parcial continua para escolher.
      e.preventDefault();e.stopPropagation();
      const index=active>=0?active:matches.findIndex(entry=>norm(entry.name)===norm(input.value));
      if(index>=0)(list.children[index] as HTMLElement).click();
    }
  });
  root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget as Node|null))close();});
  return {close};
}
