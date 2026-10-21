/** Contrato do rolador existente: sem eval, até 100 dados, lados conhecidos
 * e modificador limitado. Prévia e rolagem usam o mesmo analisador. */
export function parseDiceFormula(value:unknown) {
  const clean=String(value ?? '').toLowerCase().replace(/\s+/g,'');
  if(!clean || clean.length>200 || !/^(?:\d*d\d+|\d+)(?:[+-](?:\d*d\d+|\d+))*$/.test(clean))return null;
  const counts:Record<number,number>={},normalized:string[]=[];
  let modifier=0,totalDice=0;
  for(const match of clean.matchAll(/([+-]?)(\d*d\d+|\d+)/g)) {
    const sign=match[1]==='-'?-1:1,term=match[2];
    if(term.includes('d')) {
      const [countText,sidesText]=term.split('d'),count=Number(countText || 1),sides=Number(sidesText);
      if(sign<0 || !Number.isSafeInteger(count) || count<1 || ![4,6,8,10,12,20,100].includes(sides))return null;
      totalDice+=count;if(totalDice>100)return null;
      counts[sides]=(counts[sides] || 0)+count;
      normalized.push(`${normalized.length?'+':''}${count}d${sides}`);
    }else {
      const number=Number(term);if(!Number.isSafeInteger(number) || number>10000)return null;
      modifier+=sign*number;if(Math.abs(modifier)>10000)return null;
      normalized.push(`${normalized.length && sign>0?'+':sign<0?'-':''}${number}`);
    }
  }
  return {formula:normalized.join(''),counts,modifier};
}
