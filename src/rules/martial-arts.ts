import {active,level,type Engine,type Sheet} from './model';

export const UNARMED={name:'Golpe desarmado',kind:'unarmed',damage:'1',damageType:'concussão',properties:'Desarmado · ataque corpo a corpo, sem arma'};
/** Opção operacional do editor, sem alterar o catálogo gerado do livro. Só o
 * vínculo explícito ativa o cálculo; nomes/textos manuais continuam manuais. */
export const weaponChoices=(E:Engine)=>[...E.progression.weapons,UNARMED];
export const martialDie=(c:Sheet)=>level(c,'monge')>=17?10:level(c,'monge')>=11?8:level(c,'monge')>=5?6:4;
export const martialArtsAvailable=(c:Sheet)=>level(c,'monge')>=1 && !c.armorEquipped && !c.shieldEquipped && !active(c,'druida:wildShape');
