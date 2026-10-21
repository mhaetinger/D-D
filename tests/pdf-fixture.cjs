// PDF sintético mínimo com widgets. Nenhuma ficha real ou livro vai ao Git.
// A ausência de /AcroForm reproduz a árvore quebrada: os campos sobrevivem em
// /Annots, como em formulários preenchidos por alguns editores de PDF.
function filledPdf(values,{acroForm=false}={}) {
  const hex=s=>'<FEFF'+Array.from(String(s)).map(c=>c.charCodeAt(0).toString(16).padStart(4,'0')).join('').toUpperCase()+'>';
  const entries=Object.entries(values),refs=entries.map((_,i)=>`${6+i} 0 R`),objects=[`<< /Type /Catalog /Pages 2 0 R ${acroForm?'/AcroForm << /Fields ['+refs.join(' ')+'] /DR << /Font << /Helv 4 0 R >> >> /DA (/Helv 10 Tf 0 g) >>':''} >>`,'<< /Type /Pages /Count 1 /Kids [3 0 R] >>',`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /Helv 4 0 R >> >> /Contents 5 0 R /Annots [${refs.join(' ')}] >>`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Length 0 >>\nstream\n\nendstream',...entries.map(([name,value],i)=>`<< /Type /Annot /Subtype /Widget /FT /Tx /T ${hex(name)} /V ${hex(value)} /Rect [40 ${740-i*12} 300 ${750-i*12}] /P 3 0 R /F 4 /DA (/Helv 10 Tf 0 g) >>`)];
  let output='%PDF-1.7\n',offsets=[0];objects.forEach((obj,i)=>{offsets.push(Buffer.byteLength(output));output+=`${i+1} 0 obj\n${obj}\nendobj\n`;});const offset=Buffer.byteLength(output);output+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;return Buffer.from(output);
}
module.exports={filledPdf};
