import { readPreference, writePreference } from '../storage/preferences';

const VIEW_KEY='critcall_character_list_view_v1';
type Tab='profile'|'characters';

/** As abas mantêm os formulários montados. A visualização da coleção é uma
 * preferência deste navegador e não faz parte dos documentos dos personagens. */
export function selectAccountTab(tab:Tab,focus=false):void {
  const modal=document.getElementById('authAccountModal')!;
  for(const button of modal.querySelectorAll<HTMLButtonElement>('[data-account-tab]')){
    const selected=button.dataset.accountTab===tab;
    button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
    if(selected && focus)button.focus({preventScroll:true});
  }
  for(const panel of modal.querySelectorAll<HTMLElement>('[data-account-panel],[data-account-only]'))panel.hidden=(panel.dataset.accountPanel||panel.dataset.accountOnly)!==tab;
  modal.querySelector<HTMLElement>('[data-scroll-window]')!.scrollTop=0;
}

export function refreshAccountView():void {
  const view=readPreference(VIEW_KEY)==='cards'?'cards':'list';
  document.getElementById('accountCharactersList')!.dataset.characterView=view;
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-account-view]'))button.setAttribute('aria-pressed',String(button.dataset.accountView===view));
}

export function setupAccountPanel():void {
  const modal=document.getElementById('authAccountModal')!;
  refreshAccountView();
  modal.addEventListener('click',event=>{
    const target=event.target as HTMLElement,tab=target.closest<HTMLButtonElement>('[data-account-tab]'),view=target.closest<HTMLButtonElement>('[data-account-view]');
    if(tab)selectAccountTab(tab.dataset.accountTab as Tab);
    if(view){
      const value=view.dataset.accountView!;
      // A troca usa os mesmos cartões, retratos e botões, mesmo sem armazenamento.
      writePreference(VIEW_KEY,value);
      document.getElementById('accountCharactersList')!.dataset.characterView=value;
      for(const button of modal.querySelectorAll<HTMLButtonElement>('[data-account-view]'))button.setAttribute('aria-pressed',String(button===view));
    }
  });
  modal.addEventListener('keydown',event=>{
    const current=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-account-tab]');
    if(!current || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const tab=event.key==='Home'?'profile':event.key==='End'?'characters':current.dataset.accountTab==='profile'?'characters':'profile';
    selectAccountTab(tab,true);
  });
}
