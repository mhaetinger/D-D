import { validateCharacters, type CharacterRecord } from './validation';
import type { StoragePort } from './account-scope';
import { canonical } from './canonical';

export const HISTORY_PREFIX='dnd_character_history_v2:';
export const historyKey=(id:string)=>HISTORY_PREFIX+id;
export const isCharacterHistoryKey=(key:string)=>key.startsWith(HISTORY_PREFIX) && key.length>HISTORY_PREFIX.length && key.length<HISTORY_PREFIX.length+200;
export interface HistoryStep {timestamp:string;action:string;isCheckpoint:boolean;stateJson:string}
export interface CharacterHistory {version:2;characterId:string;stack:HistoryStep[];pointer:number}
export const HISTORY_MAX_STEPS=10;
export const HISTORY_MAX_BYTES=256*1024;
/** Só limita um histórico legível ao gravar. Mantém o estado apontado e os
 * passos mais próximos; se um único passo superar o teto, ele é preservado. */
export function boundedCharacterHistory(history:CharacterHistory):CharacterHistory {
  let start=0,end=history.stack.length;
  const bytes=history.stack.map(step=>new TextEncoder().encode(JSON.stringify(step)).byteLength),pointer=history.pointer;
  let total=bytes.reduce((n,b)=>n+b,0)+Math.max(0,bytes.length-1)+new TextEncoder().encode(JSON.stringify({...history,stack:[]})).byteLength;
  while(end-start>1&&(end-start>HISTORY_MAX_STEPS||total>HISTORY_MAX_BYTES)){
    if(pointer-start>=end-1-pointer)total-=bytes[start++]+1;else total-=bytes[--end]+1;
  }
  return {...history,stack:history.stack.slice(start,end),pointer:pointer-start};
}
export function characterSnapshot(char:CharacterRecord) {
  const copy=structuredClone(char);delete copy.preferredLayout;
  return JSON.stringify([copy]);
}
export function historyComparable(value:string) {
  const characters=JSON.parse(value);
  for(const c of characters){delete c.preferredLayout;delete c.playerName;}
  return canonical(characters);
}
export function validateCharacterHistory(raw:string,id:string):CharacterHistory {
  if(raw.length>15_000_000) throw new Error('Histórico maior que o limite.');
  const h=JSON.parse(raw);
  if(h.version!==2 || h.characterId!==id || !Array.isArray(h.stack) || !Number.isInteger(h.pointer) || h.pointer<0 || h.pointer>=h.stack.length) throw new Error('Histórico de personagem inválido.');
  for(const step of h.stack) {
    if(!step || typeof step.action!=='string' || typeof step.timestamp!=='string' || typeof step.stateJson!=='string') throw new Error('Passo inválido.');
    const chars=validateCharacters(JSON.parse(step.stateJson));
    if(chars.length!==1 || chars[0].id!==id) throw new Error('Passo pertence a outra ficha.');
  }
  return h;
}

/** Separa mudanças reais por ID. Checkpoints antigos sem autor inequívoco ficam
 * no original preservado; não são atribuídos a todos os personagens. */
export function splitLegacyHistory(raw:string):Map<string,CharacterHistory> {
  const old=JSON.parse(raw),result=new Map<string,CharacterHistory>();
  if(!Array.isArray(old.stack) || !Number.isInteger(old.pointer) || old.pointer<0 || old.pointer>=old.stack.length) throw new Error('Histórico antigo inválido.');
  let previous=new Map<string,string>();
  for(const [index,step] of old.stack.entries()) {
    if(typeof step.action!=='string' || typeof step.timestamp!=='string' || typeof step.stateJson!=='string') throw new Error('Passo antigo inválido.');
    const chars=validateCharacters(JSON.parse(step.stateJson)),next=new Map<string,string>();
    for(const c of chars) {
      const snapshot=characterSnapshot(c),comparable=historyComparable(snapshot);
      let own=result.get(c.id);
      if(!own){own={version:2,characterId:c.id,stack:[],pointer:0};result.set(c.id,own);}
      if(previous.get(c.id)!==comparable) {
        own.stack.push({...step,stateJson:snapshot});
        if(index<=old.pointer) own.pointer=own.stack.length-1;
      }
      next.set(c.id,comparable);
    }
    previous=next;
  }
  return result;
}

const migrated=new WeakMap<StoragePort,{raw:string;keys:string[]}>();
export function migrateCharacterHistories(port:StoragePort):string[] {
  const raw=port.getItem('dnd_history_v1');if(!raw) return [];
  const cached=migrated.get(port);if(cached?.raw===raw) return cached.keys;
  const keys:string[]=[];
  for(const [id,h] of splitLegacyHistory(raw)) {
    const key=historyKey(id);keys.push(key);
    if(port.getItem(key)===null) port.setItem(key,JSON.stringify(h));
  }
  migrated.set(port,{raw,keys});return keys;
}
