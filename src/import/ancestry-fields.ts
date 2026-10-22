import {escape,type Engine,type Sheet} from '../rules/model';
import {DRAGON_ANCESTRIES,dragonAncestry,breathProfile,setDragonChoice} from '../rules/draconic-ancestry';

export function ancestryFields(c:Sheet,E:Engine){
  const element=document.createElement('section');element.className='import-ancestry-fields';
  const group=(key:string,title:string)=>`<fieldset data-import-ancestry-group="${key}"><legend>${title}</legend><label>Cor do ancestral<select data-import-ancestry="${key}"><option value="">Escolher depois / não informado</option>${DRAGON_ANCESTRIES.map(x=>`<option value="${escape(x.choice)}">${escape(x.choice)}</option>`).join('')}</select></label><p data-import-ancestry-help="${key}"></p></fieldset>`;
  element.innerHTML=group('raceDragon','Draconato · ancestralidade racial')+group('dragon','Feiticeiro · Linhagem Dracônica');
  function sync(){
    const racial=c.rules.raceId==='draconato',sorcerer=c.classes.some((x:Sheet)=>x.classId==='feiticeiro'&&(x.subclassId||E.inferSubclass(x))==='draconica');
    element.hidden=!racial&&!sorcerer;
    for(const key of ['raceDragon','dragon']){
      element.querySelector<HTMLElement>(`[data-import-ancestry-group="${key}"]`)!.hidden=key==='raceDragon'?!racial:!sorcerer;
      const select=element.querySelector<HTMLSelectElement>(`[data-import-ancestry="${key}"]`)!;
      const stored=E.selections(c,key==='dragon'?'feiticeiro':null,key).at(-1);
      select.value=dragonAncestry(stored)?.choice||'';
      const profile=breathProfile(c,select.value),help=element.querySelector<HTMLElement>(`[data-import-ancestry-help="${key}"]`)!;
      help.textContent=!profile?'O arquivo não informou esta escolha. Escolha a cor para registrar o elemento correto.':key==='dragon'?`${profile.choice}. Define o elemento de Afinidade Elemental a partir do 6º nível de feiticeiro.`:`${profile.choice}. Resistência a esse dano. Sopro: ${profile.area}; resistência de ${profile.save==='dex'?'Destreza':'Constituição'}${profile.dc!==null?', CD '+profile.dc:''}; ${profile.dice||'dano por conferir'} (metade no sucesso). Uma ação; recupera no descanso curto ou longo. Livro 2014, p. 34.`;
    }
  }
  element.addEventListener('change',e=>{const select=e.target as HTMLSelectElement;if(select.dataset.importAncestry){setDragonChoice(c,select.dataset.importAncestry as 'raceDragon'|'dragon',select.value);sync();}});
  sync();return {element,sync};
}
