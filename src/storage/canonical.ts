/** JSONB pode reordenar propriedades; a comparação considera o conteúdo. */
export function canonical(value:unknown):string {
  return JSON.stringify(value,(_,item)=>item && typeof item==='object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
}
