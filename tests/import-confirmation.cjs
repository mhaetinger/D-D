const {confirmationActions}=require('./confirmation.cjs');
async function confirmImportReview(page) {
  const {dialog,accept}=confirmationActions(page);
  await dialog.locator('[data-import-review]').waitFor({state:'visible'});
  const ack=dialog.locator('[data-import-ack]');if(await ack.isVisible())await ack.check();
  await accept();
  if(await dialog.locator('[data-import-review]').count())throw new Error('A ficha sintética ainda exige revisão: '+await dialog.locator('[data-import-error]').innerText());
}
module.exports={confirmImportReview};
