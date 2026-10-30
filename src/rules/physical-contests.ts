import {active,level,type Sheet,type Engine} from './model';
import {skillBonus,hasFeat} from './passives';
import {incapacityReason} from './concentration';
import {canShieldMaster} from './shield-master';
import {sheetRollDetails} from './roll-context';
import {sheetD20Rules,type RollMode} from './dice-roll';

export const PHYSICAL_CONTESTS={
 grapple:{name:'Agarrar',cost:'um ataque da ação Atacar',requirement:'Tenho mão livre; o alvo está ao meu alcance e é no máximo uma categoria maior que eu.'},
 shove:{name:'Empurrar / derrubar',cost:'um ataque da ação Atacar',requirement:'O alvo está ao meu alcance e é no máximo uma categoria maior que eu.'},
 pin:{name:'Imobilizador · imobilizar',cost:'ação inteira',requirement:'O alvo já está agarrado por mim; tenho uma ação para tentar imobilizá-lo.'},
 shield:{name:'Mestre de Escudo · empurrar',cost:'ação bônus',requirement:'Já realizei a ação Atacar neste meu turno, empunho o escudo e tenho ação bônus; o alvo está até 1,5 m e é no máximo uma categoria maior.'},
 charge:{name:'Investida · empurrar',cost:'ação bônus',requirement:'Eu usei a ação Disparada e tenho ação bônus; o alvo está ao meu alcance e é no máximo uma categoria maior.'},
} as const;
export type PhysicalContestKind=keyof typeof PHYSICAL_CONTESTS;
export interface PhysicalContestChoice {kind:PhysicalContestKind;target:string;declared:boolean;straight:boolean;prone:boolean;opposed:number|null}
export function physicalContestOptions(c:Sheet,E:Engine):PhysicalContestKind[] {
 return ['grapple','shove',...(hasFeat(c,E,'Imobilizador')?['pin']:[]),...(canShieldMaster(c,E)?['shield']:[]),...(hasFeat(c,E,'Investida Poderosa')?['charge']:[])] as PhysicalContestKind[];
}
export function previewPhysicalContest(c:Sheet,x:PhysicalContestChoice,mode:RollMode,E:Engine) {
 if(incapacityReason(c))throw new Error('É preciso poder agir para agarrar ou empurrar.');
 if(active(c,'druida:wildShape'))throw new Error('Testes e capacidade física da Forma Selvagem continuam na mesa.');
 if(!x || !physicalContestOptions(c,E).includes(x.kind) || [x.declared,x.straight,x.prone].some(v=>typeof v!=='boolean') || x.declared!==true || typeof x.target!=='string' || !x.target.trim() || x.target.length>80 || x.opposed!==null && (!Number.isSafeInteger(x.opposed) || Math.abs(x.opposed)>1000))throw new Error('Identifique o alvo, confira o total do oponente e confirme os requisitos.');
 if(x.straight && x.kind!=='charge' || x.prone && ['grapple','pin'].includes(x.kind))throw new Error('Confira as opções de empurrão e Investida.');
 const bonus=skillBonus(c,{id:'atletismo',ability:'str'});if(!Number.isSafeInteger(bonus))throw new Error('Total de Atletismo inválido preservado.');
 const d=sheetRollDetails(c,{type:'check',ability:'str',skill:'atletismo'},mode,E),rules=sheetD20Rules(c,{type:'check',ability:'str',skill:'atletismo'},E);
 const distance=x.kind==='charge' && x.straight?3:1.5;
 const effect=x.kind==='pin'?'Você e o alvo ficam impedidos até o agarre terminar; registrem as condições nas respectivas fichas.':x.kind==='grapple'?'Alvo fica agarrado; deslocamento 0. Pode escapar com ação; confira alcance e fim do agarre na mesa.':x.prone?'Alvo fica caído; não o move.':`Afasta o alvo até ${distance} m; não o derruba automaticamente.`;
 return {...PHYSICAL_CONTESTS[x.kind],...d,rules,bonus,distance,effect,target:x.target.trim(),opposed:x.opposed};
}
/** 2014: empate mantém a situação anterior. Talento Confiável troca o valor
 * tratado do d20, e Força Indomável põe piso no TOTAL, depois de somar bônus. */
export function physicalContestResult(plan:ReturnType<typeof previewPhysicalContest>,face:number) {
 if(!Number.isInteger(face) || face<1 || face>20)throw new Error('Informe a face final do d20 entre 1 e 20.');
 const treated=plan.rules.reliableTalent?Math.max(10,face):face,total=Math.max(treated+plan.bonus,plan.rules.indomitableMight || -Infinity);
 return physicalContestTotal(plan,total);
}
export function physicalContestTotal(plan:ReturnType<typeof previewPhysicalContest>,total:number) {
 if(!Number.isSafeInteger(total))throw new Error('Total do teste inválido.');
 return {total,success:plan.opposed===null?null:total>plan.opposed,tie:total===plan.opposed};
}
