import type {Sheet} from './model';
export const COIN_RATES_IN_PC={pc:1,pp:10,pe:50,po:100,pl:1000} as const;
type Unit=keyof typeof COIN_RATES_IN_PC;
const units=Object.keys(COIN_RATES_IN_PC) as Unit[];
export function coinTotal(coins:Sheet):number|null {
  if(!coins || units.some(k=>!Number.isSafeInteger(coins[k]) || coins[k]<0))return null;
  const total=units.reduce((sum,k)=>sum+coins[k]*COIN_RATES_IN_PC[k],0);
  return Number.isSafeInteger(total)?total:null;
}
/** Calcula antes de alterar. Prefere a unidade do preço; quando falta, usa
 * moedas disponíveis e troca só o necessário. Não normaliza a bolsa inteira. */
export function deductCoinsSmart(coins:Sheet,quantity:number,unit:string) {
  if(!Object.hasOwn(COIN_RATES_IN_PC,unit) || !Number.isSafeInteger(quantity) || quantity<0)return false;
  const key=unit as Unit,cost=quantity*COIN_RATES_IN_PC[key],total=coinTotal(coins);
  if(!Number.isSafeInteger(cost) || total===null || cost>total)return false;
  const next={...coins};
  if(next[key]>=quantity)next[key]-=quantity;
  else {
    let remaining=cost;
    for(const k of units){const n=Math.min(next[k],Math.floor(remaining/COIN_RATES_IN_PC[k]));next[k]-=n;remaining-=n*COIN_RATES_IN_PC[k];}
    if(remaining){
      const k=units.find(k=>next[k]>0 && COIN_RATES_IN_PC[k]>remaining);if(!k)return false;
      next[k]--;let change=COIN_RATES_IN_PC[k]-remaining;
      for(const k of [...units].reverse()){const n=Math.floor(change/COIN_RATES_IN_PC[k]);next[k]+=n;change-=n*COIN_RATES_IN_PC[k];}
    }
  }
  if(coinTotal(next)!==total-cost)return false;
  for(const k of units)coins[k]=next[k];return true;
}
