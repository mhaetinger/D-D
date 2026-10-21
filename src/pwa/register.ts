import {sheetStore} from '../storage/character-store';

export function registerOffline() {
  const label=document.getElementById('offlineStatus');if(!label)return;
  if(!import.meta.env.PROD||!('serviceWorker' in navigator)){
    label.textContent='Uso offline disponível na versão publicada em um navegador compatível.';return;
  }
  const build=document.querySelector<HTMLMetaElement>('meta[name="critcall-build"]')?.content;
  const notice=document.createElement('aside');notice.id='appUpdate';notice.hidden=true;notice.className='app-update';notice.setAttribute('role','status');
  const text=document.createElement('span');text.textContent='Nova versão disponível.';
  const button=document.createElement('button');button.type='button';button.textContent='Atualizar';notice.append(text,button);document.body.append(notice);
  let ready=false,available=false,checking=false,request=0,registration:ServiceWorkerRegistration|undefined;
  const update=()=>{label.textContent=available?'Nova versão disponível. Use Atualizar para carregá-la.':ready?(navigator.onLine?'Ficha disponível para usar offline neste dispositivo.':'Sem conexão · ficha disponível neste dispositivo.'):'Preparando o acesso offline…';notice.hidden=!available;};
  const askVersion=()=>{
    const worker=navigator.serviceWorker.controller;if(!worker)return;
    const sequence=++request,channel=new MessageChannel();const timeout=window.setTimeout(()=>channel.port1.close(),5000);
    channel.port1.onmessage=event=>{
      clearTimeout(timeout);channel.port1.close();
      if(sequence!==request||worker!==navigator.serviceWorker.controller)return;
      const version=event.data?.version;
      if(typeof version==='string'&&/^[a-f0-9]{16}$/.test(version))available=!!build&&version!==build;
      ready=true;update();
    };
    worker.postMessage({type:'CRITCALL_BUILD',version:build},[channel.port2]);
  };
  const check=async()=>{
    if(!registration||checking||!navigator.onLine||document.hidden)return;
    checking=true;try{await registration.update();askVersion();}catch{/* Rede indisponível conserva a geração instalada. */}finally{checking=false;}
  };
  button.addEventListener('click',()=>{
    const host=window as any;
    const dirty=[...document.querySelectorAll<HTMLInputElement>('[data-sheet-field]')].some(input=>input.value!==input.dataset.sheetSaved);
    const entry=document.body.dataset.access==='entry'&&[...document.querySelectorAll<HTMLInputElement>('#accessFormSlot input')].some(input=>input.type!=='hidden'&&input.value);
    if(host.hasOpenAccountEditor?.()||dirty||entry||document.querySelector('.sheet-inline-editor:not([hidden]):not(.hidden)')){
      text.textContent='Conclua ou cancele a edição aberta antes de atualizar.';return;
    }
    if(sheetStore.hasPendingNotes||['write','unavailable'].includes(sheetStore.issue?.kind||'')){
      text.textContent='Há alterações sem salvar neste navegador. Confira o salvamento antes de atualizar.';return;
    }
    button.disabled=true;location.reload();
  });
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ready=true;askVersion();});
  window.addEventListener('online',()=>{update();void check();});window.addEventListener('offline',update);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
  window.addEventListener('focus',()=>void check());
  const scope=new URL('./',document.baseURI);update();
  void navigator.serviceWorker.register(new URL('sw.js',scope),{scope:scope.pathname,updateViaCache:'none'}).then(async value=>{
    registration=value;
    const observe=(worker:ServiceWorker|null)=>worker?.addEventListener('statechange',()=>{
      if(worker.state==='activated'){ready=true;askVersion();}
      if(worker.state==='redundant'&&!ready)label.textContent='O acesso offline não ficou pronto. Confira a conexão e o espaço disponível.';
    });
    observe(value.installing);value.addEventListener('updatefound',()=>observe(value.installing));
    await navigator.serviceWorker.ready;ready=true;askVersion();update();
    window.setInterval(()=>void check(),60000);void check();
  }).catch(()=>{label.textContent='Não foi possível preparar o acesso offline. A ficha continua disponível enquanto esta página estiver aberta.';});
}
