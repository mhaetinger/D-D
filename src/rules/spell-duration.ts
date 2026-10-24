import {type Engine,type Sheet} from './model';

/** A duração base continua sendo a da ficha/livro. A exceção de Rogar
 * Maldição depende do espaço efetivamente escolhido, não do nível do bruxo.
 * Fórmulas/efeitos próprios e concentração explicitamente desmarcada ficam. */
export function spellDuration(s:Sheet,E:Engine,castLevel?:number) {
  const entry=E.spell(s.bookId || s.name);
  let held=typeof s.conc==='boolean'?s.conc:!!entry?.concentration;
  let duration=String(s.duration || entry?.duration || '');
  const circle=castLevel ?? s.castLevel ?? s.circle ?? entry?.level;
  if(entry?.id==='rogar-maldicao' && !s.customSpell && !s.customRoll && s.conc!==false &&
    (!s.duration || s.duration===entry.duration) && Number.isInteger(circle) && circle>=3 && circle<=9){
    held=circle<5;
    duration=circle>=9?'Até ser dissipada':circle>=7?'24 horas':circle>=5?'8 horas':circle===4?'Concentração, até 10 minutos':entry.duration;
  }
  return {held,duration};
}
