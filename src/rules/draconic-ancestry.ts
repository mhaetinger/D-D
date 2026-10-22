import {ability,norm,proficiency,type Sheet} from './model';

// Livro do Jogador da mesa, p. 34 impressa (PDF 33): a cor determina também
// área e resistência do sopro de 2014, não só seu elemento.
export const DRAGON_ANCESTRIES=[
  {choice:'Azul — elétrico',type:'lightning',line:true,save:'dex'},
  {choice:'Branco — frio',type:'cold',line:false,save:'con'},
  {choice:'Bronze — elétrico',type:'lightning',line:true,save:'dex'},
  {choice:'Cobre — ácido',type:'acid',line:true,save:'dex'},
  {choice:'Latão — fogo',type:'fire',line:true,save:'dex'},
  {choice:'Negro — ácido',type:'acid',line:true,save:'dex'},
  {choice:'Ouro — fogo',type:'fire',line:false,save:'dex'},
  {choice:'Prata — frio',type:'cold',line:false,save:'con'},
  {choice:'Verde — veneno',type:'poison',line:false,save:'con'},
  {choice:'Vermelho — fogo',type:'fire',line:false,save:'dex'},
] as const;
export const dragonAncestry=(value:unknown)=>DRAGON_ANCESTRIES.find(x=>norm(x.choice)===norm(value));
export function dragonFromRaceName(value:unknown){return DRAGON_ANCESTRIES.find(x=>norm(value)==='draconato '+norm(x.choice.split(' — ')[0]));}
export function breathProfile(c:Sheet,choice:unknown){
  const dragon=dragonAncestry(choice);if(!dragon)return null;
  const total=c.classes.reduce((n:number,x:Sheet)=>n+Number(x.level),0),valid=Number.isInteger(total)&&total>=1&&total<=20;
  return {...dragon,area:dragon.line?'linha de 1,5 m × 9 m':'cone de 4,5 m',
    dice:valid?(total>=16?'5d6':total>=11?'4d6':total>=6?'3d6':'2d6'):null,
    dc:valid&&Number.isInteger(c.abilities?.con?.score)?8+ability(c,'con')+proficiency(c):null};
}
/** A proposta já é uma cópia. Corrige apenas esta escolha; os outros dados de
 * cada evento e todas as escolhas da outra origem permanecem no histórico. */
export function setDragonChoice(c:Sheet,key:'raceDragon'|'dragon',value:string){
  if(value&&!dragonAncestry(value))throw new Error('Escolha uma ancestralidade do livro.');
  c.rules ||= {history:[],legacy:true};c.rules.history ||= [];
  const matches=(h:Sheet)=>key==='raceDragon'||h.classId==='feiticeiro';
  let target=c.rules.history.find((h:Sheet)=>matches(h)&&h.answers?.[key]!==undefined)||c.rules.history.find((h:Sheet)=>h.level===1&&(key==='raceDragon'||h.classId==='feiticeiro'));
  for(const h of c.rules.history)if(matches(h)&&h.answers)delete h.answers[key];
  if(!value)return;
  if(!target){const index=c.classes.findIndex((x:Sheet)=>x.classId==='feiticeiro'),offset=key==='dragon'&&index>0?c.classes.slice(0,index).reduce((n:number,x:Sheet)=>n+Number(x.level),0):0;target={classId:key==='dragon'?'feiticeiro':null,level:1,totalLevel:offset+1,source:'import-review',answers:{}};c.rules.history.push(target);}
  target.answers ||= {};target.answers[key]=value;
}
