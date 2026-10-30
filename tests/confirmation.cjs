/** Ocultar o diálogo antecede o evento nativo `close`. Espere também a
 * continuação da confirmação antes de conferir o resultado na ficha. */
function confirmationActions(page) {
  const dialog=page.locator('#confirmationDialog');
  const choose=async button=>{
    await page.evaluate(()=>{window.critcallTestDialogClosed=new Promise(resolve=>document.getElementById('confirmationDialog').addEventListener('close',()=>queueMicrotask(resolve),{once:true}));});
    await button.click();
    // Validação de campos mantém o diálogo aberto e não confirma a operação.
    if(!await dialog.evaluate(el=>el.open))await page.evaluate(()=>window.critcallTestDialogClosed);
  };
  return {dialog,accept:()=>choose(page.locator('#confirmationAccept')),cancel:()=>choose(dialog.getByRole('button',{name:'Cancelar',exact:true}))};
}
module.exports={confirmationActions};
/** Mudanças de fonte/tema terminam antes de medir a rolagem. Espera eventos
 * reais, sem atraso fixo; as sondas de altura continuam verificando ancoragem. */
async function settleSheetAppearance(page) {
  await page.evaluate(async()=>{
    await document.fonts.ready;
    // ResizeObserver pode iniciar SizeMotion depois que a fonte terminar.
    // Esperar só a transição do html deixava a folha ainda encolhendo no fim
    // da página. Não esperamos as animações infinitas da aura do dado.
    const deadline=performance.now()+5000;
    while(performance.now()<deadline){
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const layout=document.getAnimations().filter(a=>a.playState==='running' && a.effect?.getKeyframes().some(k=>'height' in k || 'fontSize' in k));
      if(!layout.length)return;
      await Promise.all(layout.map(a=>a.finished.catch(()=>{})));
    }
    throw Error('A aparência da ficha não estabilizou para medir a rolagem.');
  });
}
module.exports.settleSheetAppearance=settleSheetAppearance;
