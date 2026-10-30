import {active,isConscious,level,norm,type Sheet} from './model';

/** IDs validados têm precedência; nomes antigos só reconhecem a subclasse
 * correspondente, sem procurar palavras soltas nas características livres. */
export function defensiveSubclass(c:Sheet,id:string,key:string,legacy:string) {
  const entry=c.classes?.find((x:Sheet)=>x.classId===id);
  return !!entry && (entry.subclassId?entry.subclassId===key:norm(entry.subclass)===norm(legacy));
}
export const landPurity=(c:Sheet)=>level(c,'druida')>=10 && defensiveSubclass(c,'druida','terra','Círculo da Terra');
// Vigilância tem texto próprio: ao contrário de Proteção/Coragem/Devoção,
// o livro não exige consciência para sua resistência a dano de magias.
export const ancientAura=(c:Sheet)=>level(c,'paladino')>=7 && defensiveSubclass(c,'paladino','ancioes','Juramento dos Anciões');
/** Imunidades próprias e incondicionais quanto à fonte. Não apaga a marca
 * anterior: a duração/causa do efeito continua sendo conferida na mesa. */
export function ownConditionImmunity(c:Sheet,id:string):string[] {
  const sources:string[]=[];
  if(id==='envenenado') {
    if(level(c,'monge')>=10)sources.push('Pureza Corporal');
    if(landPurity(c))sources.push('Proteção Natural');
  }
  if(['amedrontado','enfeiticado'].includes(id)) {
    if(id==='enfeiticado' && level(c,'bruxo')>=10 && defensiveSubclass(c,'bruxo','arquifada','A Arquifada'))sources.push('Defesa Sedutora');
    if(level(c,'barbaro')>=6 && isConscious(c) && active(c,'barbaro:rage') && defensiveSubclass(c,'barbaro','berserker','Caminho do Furioso'))sources.push('Fúria Inconsciente');
    if(isConscious(c)) {
      if(id==='amedrontado' && level(c,'paladino')>=10)sources.push('Aura de Coragem');
      if(id==='enfeiticado' && level(c,'paladino')>=7 && defensiveSubclass(c,'paladino','devocao','Juramento de Devoção'))sources.push('Aura de Devoção');
    }
  }
  return sources;
}
