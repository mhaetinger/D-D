export interface PdfField {name:string;value:string;page:number;x:number;y:number;width:number;height:number;checkbox:boolean}
export interface PdfPage {width:number;height:number;text:string}
export interface CharacterPdf {fields:PdfField[];pages:PdfPage[]}
export const MAX_CHARACTER_PDF_BYTES=15*1024*1024;

/** Lê apenas dados, sem executar JavaScript, ações, links ou anexos do PDF.
 * Alguns formulários preenchidos têm a árvore AcroForm quebrada, mas conservam
 * os widgets em cada página. Ler as anotações recupera esses campos também. */
export async function readCharacterPdf(file:File):Promise<CharacterPdf> {
  if(!file.size || file.size>MAX_CHARACTER_PDF_BYTES)throw new Error('Escolha um PDF de até 15 MB.');
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(!new TextDecoder().decode(bytes.subarray(0,1024)).includes('%PDF-'))throw new Error('O arquivo não contém um PDF válido.');
  // O build usa caminhos relativos para servir tanto na raiz quanto /D-D/.
  const assets=new URL(import.meta.env.BASE_URL+'vendor/pdfjs/',document.baseURI);
  const api=await import(/* @vite-ignore */new URL('pdf.min.mjs',assets).href);
  api.GlobalWorkerOptions.workerSrc=new URL('pdf.worker.min.mjs',assets).href;
  const task=api.getDocument({data:bytes,isEvalSupported:false,enableXfa:false,stopAtErrors:true,standardFontDataUrl:new URL('standard_fonts/',assets).href,cMapUrl:new URL('cmaps/',assets).href,cMapPacked:true});
  let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;void task.destroy();},25000);
  try {
    const doc=await task.promise;
    if(doc.numPages>20)throw new Error('A ficha deve ter até 20 páginas.');
    const fields:PdfField[]=[],pages:PdfPage[]=[];let length=0;
    for(let n=1;n<=doc.numPages;n++) {
      const page=await doc.getPage(n),viewport=page.getViewport({scale:1});
      const annotations=await page.getAnnotations(),content=await page.getTextContent();
      const text=content.items.filter((x:any)=>'str'in x).map((x:any)=>x.str+(x.hasEOL?'\n':' ')).join('');
      length+=text.length;
      pages.push({width:viewport.width,height:viewport.height,text});
      for(const a of annotations) {
        if(a.subtype!=='Widget' || !a.fieldName || /image|portrait|avatar|signature/i.test(a.fieldName))continue;
        if(String(a.fieldName).length>512)throw new Error('O PDF contém um nome de campo grande demais.');
        const value=Array.isArray(a.fieldValue)?a.fieldValue.join(', '):String(a.fieldValue??'');
        if(value.length>100000)throw new Error('Um campo do PDF é grande demais para importar.');
        const rect=a.rect || [0,0,0,0];length+=value.length+String(a.fieldName).length+32;
        fields.push({name:String(a.fieldName),value:value.replace(/\r\n?/g,'\n'),page:n,x:rect[0],y:viewport.height-rect[3],width:rect[2]-rect[0],height:rect[3]-rect[1],checkbox:a.fieldType==='Btn'});
      }
      if(fields.length>4000 || length>2000000)throw new Error('O PDF contém campos demais para esta importação.');
      page.cleanup();
    }
    if(!fields.some(f=>f.value.trim() && f.value!=='Off'))throw new Error('Não encontrei campos preenchidos neste PDF. Use o PDF preenchível original; fotos, digitalizações e PDFs achatados ainda não têm leitura automática.');
    return {fields,pages};
  }catch(error:any) {
    if(timedOut)throw new Error('A leitura do PDF demorou demais. Tente uma ficha menor.');
    if(error?.name==='PasswordException')throw new Error('Este PDF tem senha. Salve uma cópia sem senha para importar.');
    throw error;
  }finally {clearTimeout(timer);await task.destroy();}
}
