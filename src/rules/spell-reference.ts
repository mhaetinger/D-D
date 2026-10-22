import type {Engine,Sheet} from './model';

/** O vínculo usa o ID do catálogo. Uma magia da mesa com nome igual ao do
 * livro continua própria e não recebe uma referência oficial por coincidência. */
export function linkedSpell(s:Sheet,E:Engine):Sheet|null {
  return !s.customSpell&&s.bookId?E.spell(s.bookId)||null:null;
}
export function importSpellReference(s:Sheet,E:Engine):Sheet|null {
  const entry=linkedSpell(s,E);if(!entry?.text)return null;
  return {text:`Catálogo do Livro do Jogador · regras de 2014\n\n${entry.text}`,page:entry.page,pdfPage:entry.pdfPage};
}
export function spellCatalogDetail(entry:Sheet,E:Engine):string {
  const classes=entry.classes.map((id:string)=>E.data.classes[id]?.name).filter(Boolean);
  const races=Object.values(E.options.races).filter((r:any)=>Object.values(r.racialSpells||{}).flat().some((name:any)=>E.spell(name)?.id===entry.id)).map((r:any)=>r.name);
  return [entry.level===0?'Truque':entry.level+'º círculo','Listas de classe: '+classes.join(', '),races.length?'Traço racial: '+races.join(', '):'Outras características ou talentos também podem conceder esta magia.'].join(' · ');
}
