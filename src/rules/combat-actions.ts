import {catalogueWeapon,weaponStats} from './combat';
import {active,norm,type Engine,type Sheet} from './model';
import {hasFeat} from './passives';
import {incapacityReason} from './concentration';
import {martialDie} from './martial-arts';
import {parseDiceFormula} from './dice-formula';

export const COMBAT_ACTIONS={
 context:{name:'Ataque com contexto',cost:'ataque',requirement:'Confira alcance, alvo e disponibilidade deste ataque na mesa.'},
 polearmBonus:{name:'Haste · outra extremidade',cost:'ação bônus',requirement:'No meu turno, já realizei Atacar somente com armas elegíveis deste talento, incluindo esta que empunho; tenho ação bônus disponível.'},
 crossbowBonus:{name:'Besta de mão · ataque bônus',cost:'ação bônus',requirement:'No meu turno, já usei Atacar com arma de uma mão; empunho esta besta de mão, tenho munição, mão livre para municiar e ação bônus disponível.'},
 charge:{name:'Investida · ataque',cost:'ação bônus',requirement:'Eu usei minha ação para Disparada e tenho ação bônus disponível para este ataque corpo a corpo.'},
 greatBonus:{name:'Armas Grandes · ataque bônus',cost:'ação bônus',requirement:'Neste meu turno, causei crítico com arma corpo a corpo ou reduzi criatura a 0 PV com uma; tenho ação bônus disponível. Não exige arma pesada neste ataque bônus.'},
 polearmOpportunity:{name:'Haste · oportunidade na entrada',cost:'reação',requirement:'Empunho esta arma e vejo a criatura entrar no alcance dela usando movimento, ação ou reação; não é transporte/empurrão. Ela não evita oportunidade e tenho reação disponível.'},
 sentinelOpportunity:{name:'Sentinela · oportunidade na saída',cost:'reação',requirement:'Vejo a criatura sair do meu alcance usando movimento, ação ou reação; é oportunidade válida, mesmo com Desengajar. Não ignora Mobilidade ou outros efeitos que evitem oportunidade. Tenho reação disponível.'},
 sentinelReaction:{name:'Sentinela · ataque contra terceiro',cost:'reação',requirement:'Uma criatura a até 1,5 m acabou de atacar outro alvo, que não tem Sentinela; o ataque dela já terminou e tenho reação disponível. Esta reação não é ataque de oportunidade.'},
} as const;
export type CombatActionKind=keyof typeof COMBAT_ACTIONS;
export interface CombatActionChoice {kind:CombatActionKind;target:string;declared:boolean;straight:boolean;martial:boolean;hostileNear:boolean;grappled:boolean}
const polearmBonus=['alabarda','glaive','bordao','lanca'],polearmOpportunity=[...polearmBonus,'lanca longa'];
export function combatActionOptions(c:Sheet,entry:Sheet,E:Engine):CombatActionKind[] {
 const w=weaponStats(c,entry,E);if(!c.weapons?.includes(entry) || !w.ruleWeapon || w.calculationMode==='manual' || !w.weaponDie || w.weaponDie==='0' || active(c,'druida:wildShape'))return [];
 const out:CombatActionKind[]=[],name=norm(w.ruleWeapon),melee=w.meleeAttack && entry.attackMode!=='thrown';
 if(w.rangedWeapon || entry.attackMode==='thrown' || hasFeat(c,E,'Imobilizador'))out.push('context');
 if(melee && hasFeat(c,E,'Maestria em Arma de Haste')){if(polearmBonus.includes(name))out.push('polearmBonus');if(polearmOpportunity.includes(name))out.push('polearmOpportunity');}
 if(name==='besta de mao' && hasFeat(c,E,'Especialista em Besta'))out.push('crossbowBonus');
 if(melee && hasFeat(c,E,'Investida Poderosa'))out.push('charge');
 if(melee && hasFeat(c,E,'Mestre de Armas Grandes'))out.push('greatBonus');
 if(melee && hasFeat(c,E,'Sentinela'))out.push('sentinelOpportunity','sentinelReaction');
 return out;
}
export function previewCombatAction(c:Sheet,entry:Sheet,x:CombatActionChoice,E:Engine) {
 if(!x || !combatActionOptions(c,entry,E).includes(x.kind) || [x.declared,x.straight,x.martial,x.hostileNear,x.grappled].some(v=>typeof v!=='boolean'))throw new Error('Este ataque, talento ou cálculo não permite a ação escolhida.');
 if(incapacityReason(c))throw new Error('É preciso poder realizar este ataque.');
 if(typeof x.target!=='string' || !x.target.trim() || x.target.length>80 || x.declared!==true)throw new Error('Identifique o alvo e confirme os requisitos da ação.');
 for(const key of ['attackAdjustment','damageAdjustment','magicBonus'])if(entry[key]!=null && (typeof entry[key]!=='number' || !Number.isSafeInteger(entry[key]) || Math.abs(entry[key])>1000))throw new Error('Ajuste da arma inválido preservado; confira o cadastro.');
 const base=weaponStats(c,entry,E),w=weaponStats(c,x.kind==='context'?entry:{...entry,offHand:false},E);
 if(x.kind!=='context' && c.shieldEquipped && (/duas mãos/i.test(w.properties) || entry.hands===2 || x.kind==='crossbowBonus'))throw new Error('O escudo ocupa uma mão: confira as mãos exigidas pela arma e para municiar.');
 if(x.martial && (x.kind!=='polearmBonus' || !w.monkWeapon))throw new Error('Artes Marciais só substitui o dado deste ataque de haste quando a arma e o equipamento permitem.');
 if(x.straight && x.kind!=='charge')throw new Error('O deslocamento em linha reta é próprio da Investida.');
 if(x.grappled && !hasFeat(c,E,'Imobilizador'))throw new Error('Vantagem contra criatura agarrada por você exige Imobilizador.');
 if(x.kind==='polearmBonus') {
  // O cabo não é ataque com segunda arma. Usa habilidade, magia e bônus
  // elegíveis normais; só troca o dado/tipo do ataque, nunca o cadastro.
  w.weaponDie='1d'+(x.martial?martialDie(c):4);w.dmgTypeLabel='concussão';
  const bonus=Number(w.damageBonus)+(Number(w.lifedrinker)||0);
  w.damage=w.weaponDie+(w.improvedSmite?'+1d8':'')+(bonus<0?'':'+')+bonus;
 }
 if(!/^[+-]?\d+$/.test(w.bonus) || !Number.isSafeInteger(Number(w.bonus)) || Math.abs(Number(w.bonus))>1000 || !parseDiceFormula(w.damage))throw new Error('Bônus ou dano da arma inválido preservado; confira o cadastro antes de declarar a ação.');
 const fixed=x.kind==='charge' && x.straight?5:0;
 const opportunity=['polearmOpportunity','sentinelOpportunity'].includes(x.kind),stop=opportunity && hasFeat(c,E,'Sentinela');
 return {choice:{...x,target:x.target.trim()},w,base,kind:x.kind,...COMBAT_ACTIONS[x.kind],fixed,opportunity,stop,
  reach:/\balcance\b/i.test(w.properties)?3:1.5,
  note:stop?'Se este ataque de oportunidade acertar, o deslocamento do alvo será 0 até o fim deste turno; aplique na mesa.':x.kind==='sentinelReaction'?'Reação após o ataque contra terceiro; não zera deslocamento por Sentinela.':x.kind==='crossbowBonus'?'Recarga pode ser ignorada somente com proficiência; munição e mão livre continuam necessárias.':'Confirme acerto e efeito na mesa.'};
}
