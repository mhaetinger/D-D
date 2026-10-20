// As regressões de edição usam a mesma ação explícita disponível ao jogador.
async function unlockSheet(page) {
 const button=page.locator('#sheetEditLock');
 if(await button.getAttribute('aria-pressed')!=='true')await button.click();
}
module.exports={unlockSheet};
