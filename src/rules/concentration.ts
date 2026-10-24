import { active, level, norm, state, type Engine, type Sheet } from './model';
import {spellDuration} from './spell-duration';

export interface ConcentrationCheck { id:string; dc:number; damage:number; shape:boolean }
export interface Concentration { version:1; id:string; name:string; duration:string; spellKey:string; school:string; checks:ConcentrationCheck[]; resourceId?:string }
const record=(x:any)=>!!x && typeof x==='object' && !Array.isArray(x);
export function concentration(c:Sheet):Concentration|null {
  const x=c.ruleState?.concentration;
  if(!record(x) || x.version!==1 || typeof x.id!=='string' || typeof x.name!=='string' || typeof x.duration!=='string' || typeof x.spellKey!=='string' || typeof x.school!=='string' || !Array.isArray(x.checks)) return null;
  if(x.resourceId!==undefined && !['clerigo:duplicate','feiticeiro:presence'].includes(x.resourceId))return null;
  if(!x.checks.every((t:any)=>record(t) && typeof t.id==='string' && Number.isInteger(t.dc) && t.dc>=10 && Number.isInteger(t.damage) && t.damage>0 && typeof t.shape==='boolean')) return null;
  return x;
}
export const concentrationInvalid=(c:Sheet)=>c.ruleState?.concentration!=null && !concentration(c);
/** Incapacitação é derivada, sem gravar cópias das condições que a causam. */
export function incapacityReason(c:Sheet):string|null {
  if(c.ruleState?.death?.dead || Number(c.ruleState?.death?.failures)>=3 || Number(c.exhaustion)>=6) return 'Morto';
  if(c.hpCurrent<=0 && !active(c,'druida:wildShape')) return 'Inconsciente a 0 PV';
  if(c.conscious===false || c.ruleState?.conditions?.inconsciente===true) return 'Inconsciente';
  const names:Record<string,string>={incapacitado:'Incapacitado',atordoado:'Atordoado',paralisado:'Paralisado',petrificado:'Petrificado'};
  return Object.entries(names).find(([id])=>c.ruleState?.conditions?.[id]===true)?.[1] || null;
}
export function concentrationBlock(c:Sheet) {
  if(concentrationInvalid(c)) return 'Registro de concentração ilegível preservado. Baixe um backup e confira os dados antes de substituí-lo.';
  return incapacityReason(c) || (active(c,'barbaro:rage')?'Fúria impede manter concentração':null);
}
function next(c:Sheet,key:string) { const s=state(c);s[key]=Math.max(0,Number.isSafeInteger(s[key])?s[key]:0)+1;return String(s[key]); }
export function endConcentration(c:Sheet) {
  const old=concentration(c);if(!old)return null;
  if(old.resourceId)state(c).active[old.resourceId]=false;
  state(c).concentration=null;return old;
}
export function validateConcentrationStart(c:Sheet,description:{name:string;resourceId?:string}) {
  const blocked=concentrationBlock(c);if(blocked)throw new Error(blocked);
  if(typeof description.name!=='string' || !description.name.trim() || description.name.length>500)throw new Error('Informe o nome do efeito de concentração.');
  if(description.resourceId!==undefined && !['clerigo:duplicate','feiticeiro:presence'].includes(description.resourceId))throw new Error('Recurso sem vínculo de concentração reconhecido.');
}
export function startConcentration(c:Sheet,description:{name:string;duration?:string;spellKey?:string;school?:string;resourceId?:string}) {
  validateConcentrationStart(c,description);
  endConcentration(c);
  const s=state(c);
  const current:Concentration={version:1,id:next(c,'concentrationSequence'),name:description.name.trim(),duration:String(description.duration || ''),spellKey:String(description.spellKey || ''),school:String(description.school || ''),checks:[]};
  if(description.resourceId)current.resourceId=description.resourceId;
  s.concentration=current;return current;
}
export function spellConcentration(c:Sheet,spell:Sheet,E:Engine,ritual=false,castLevel?:number) {
  const entry=E.spell(spell.bookId || spell.name),{held,duration}=spellDuration(spell,E,castLevel);
  const time=norm(spell.time || entry?.time);
  const prolonged=ritual || /\b(?:minutos?|min|horas?|hours?|minutes?)\b/.test(time) || /\b(?:[2-9]|\d{2,})\s+(?:acoes|rodadas)\b/.test(time);
  const spellKey=[spell.classId || '',spell.extraSource || '',entry?.id || spell.name].join(':');
  return {held,prolonged,spellKey,name:spell.name,duration,school:entry?.school || spell.school || ''};
}
export function needsConcentrationConfirmation(c:Sheet,spell:Sheet,E:Engine,ritual=false,castLevel?:number) {
  const old=concentration(c),next=spellConcentration(c,spell,E,ritual,castLevel);
  return !!old && (next.held || next.prolonged) && (!next.held || old.spellKey!==next.spellKey);
}
/** A interface registra conjurações concluídas. Tempo, turnos e interrupções
 * durante uma conjuração prolongada permanecem a cargo da mesa. */
export function applyCastConcentration(c:Sheet,spell:Sheet,E:Engine,ritual=false,castLevel?:number) {
  const next=spellConcentration(c,spell,E,ritual,castLevel);
  if(next.held) return startConcentration(c,next);
  if(next.prolonged) endConcentration(c);
  return concentration(c);
}
export function focusedConjuration(c:Sheet) {
  return norm(concentration(c)?.school)==='conjuracao' && c.classes.some((x:Sheet)=>x.classId==='mago' && x.level>=10 && (x.subclassId==='conjuracao' || norm(x.subclass).includes('conjuracao')));
}
export function queueConcentrationDamage(c:Sheet,damage:number,shape=false) {
  const current=concentration(c);if(!current)return null;
  if(incapacityReason(c)) {endConcentration(c);return null;}
  if(!Number.isFinite(damage) || damage<=0 || focusedConjuration(c))return null;
  const received=Math.floor(damage);
  if(received<1)return null;
  const check:ConcentrationCheck={id:next(c,'concentrationCheckSequence'),dc:Math.max(10,Math.floor(received/2)),damage:received,shape};
  current.checks.push(check);return check;
}
/** 1/20 naturais não são resultados automáticos nesta resistência de 2014. */
export function resolveConcentration(c:Sheet,concentrationId:string,checkId:string|null,natural:number,bonus:number,environmentDC=10) {
  const current=concentration(c);
  if(!current || current.id!==concentrationId)throw new Error('A concentração mudou. Nenhum teste foi aplicado ao efeito novo.');
  const blocked=concentrationBlock(c);if(blocked)throw new Error(blocked);
  const first=current.checks[0];
  if(checkId!==null && first?.id!==checkId || checkId===null && first)throw new Error('Resolva o primeiro teste pendente de concentração.');
  const dc=checkId===null?environmentDC:first!.dc;
  if(!Number.isInteger(natural) || natural<1 || natural>20 || !Number.isInteger(bonus) || Math.abs(bonus)>1000 || !Number.isInteger(dc) || dc<1)throw new Error('Confira a face do d20, o bônus e a CD do teste.');
  const total=natural+bonus,success=total>=dc;
  if(success && checkId!==null)current.checks.shift();
  if(!success)endConcentration(c);
  return {natural,total,dc,success,name:current.name};
}
