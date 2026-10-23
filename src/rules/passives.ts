import { ability, level, norm, proficiency, selections, subclass, type Engine, type Sheet } from './model';

export const hasFeat = (c:Sheet,E:Engine,name:string) => selections(c,E,'feat').concat(selections(c,E,'racialFeat')).some((x:string)=>norm(x)===norm(name));
export const bladePact = (c:Sheet,E:Engine) => level(c,'bruxo')>=3 && E.selections(c,'bruxo','pact').includes('lamina');

/** O vínculo é confirmado pelo jogador: o nome/forma inicial não identifica
 * qual das armas guardadas é a arma do pacto. Totais manuais têm precedência. */
export function lifedrinkerBonus(c:Sheet,w:Sheet,E:Engine) {
  return w.pactWeapon===true && level(c,'bruxo')>=12 && bladePact(c,E) && E.selections(c,'bruxo','invocations').includes('Sorvedor de Vida') ? Math.max(1,ability(c,'cha')) : 0;
}

/** Mantém o contrato do bônus ativo anterior, inclusive ajuste total zero. */
export function untrainedAbilityBonus(c:Sheet,key:string) {
  const fighter=c.classes.find((x:Sheet)=>x.classId==='guerreiro');
  const champion=fighter?.subclassId?fighter.subclassId==='campeao':norm(fighter?.subclass).split(' ').includes('campeao');
  const athlete=fighter?.level>=7 && champion && ['str','dex','con'].includes(key);
  // As duas metades não acumulam. Atletismo Extraordinário arredonda para
  // cima; Versatilidade, para baixo. Só testes sem proficiência chegam aqui.
  return Math.max(athlete?Math.ceil(proficiency(c)/2):0,level(c,'bardo')>=2?Math.floor(proficiency(c)/2):0);
}
export function skillBonus(c:Sheet,skill:Sheet) {
  return c.customSkillBonuses?.[skill.id] ?? (ability(c,skill.ability)+(c.skillsProf.includes(skill.id)?proficiency(c)*(c.expertise?.includes(skill.id)?2:1):untrainedAbilityBonus(c,skill.ability)));
}
export function passiveSkill(c:Sheet,skill:Sheet,E:Engine,mode:'normal'|'adv'|'dis'='normal') {
  const bonus=skillBonus(c,skill),observer=['percepcao','investigacao'].includes(skill.id) && hasFeat(c,E,'Observador')?5:0;
  const situational=mode==='adv'?5:mode==='dis'?-5:0;
  return {total:10+bonus+observer+situational,bonus,observer,situational};
}

/** A origem de feiticeiro é independente da ancestralidade racial. Tipos
 * variáveis/ambíguos do catálogo não são escolhidos em nome da mesa. */
export function elementalAffinityBonus(c:Sheet,damageType:string,E:Engine) {
  if(level(c,'feiticeiro')<6 || subclass(c,'feiticeiro',E)!=='draconica')return 0;
  const choice=E.selections(c,'feiticeiro','dragon').at(-1);
  if(!E.options.dragons.includes(choice))return 0;
  return norm(String(choice).split('—').at(-1))===norm(damageType)?ability(c,'cha'):0;
}
