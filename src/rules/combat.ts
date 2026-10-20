import { ability, active, level, norm, proficiency, savingThrowBonus, selections, subclass, type Engine, type Sheet } from './model';
import { hitPointMaximum, syncIncapacity, trackDamageAtZero } from './health';
import { queueConcentrationDamage } from './concentration';
import { conditionSpeed } from './conditions';
import { arcaneWardPoints, previewTypedDamage, type DamagePacket } from './damage';
import { commitSurvival, previewSurvival, type SurvivalChoice, type SurvivalPlan } from './survival';

const aliases: Record<string,string> = { warhammer:'Martelo de guerra', longsword:'Espada longa', shortsword:'Espada curta', dagger:'Adaga', quarterstaff:'Bordão', rapier:'Rapieira', handaxe:'Machadinha', greataxe:'Machado grande', longbow:'Arco longo', shortbow:'Arco curto', 'light crossbow':'Besta leve', 'heavy crossbow':'Besta pesada' };
export function catalogueWeapon(entry: Sheet, E: Engine) {
  const name = norm(entry.ruleWeapon || entry.name).replace(/\s+[123]$/, '');
  return E.progression.weapons.find((w: Sheet) => norm(w.name) === norm(aliases[name] || name));
}
export function isProficient(c: Sheet, entry: Sheet, w: Sheet, E: Engine) {
  if (typeof entry.proficient === 'boolean') return entry.proficient;
  const ids = c.classes.map((x: Sheet) => x.classId), primary = ids[0], simple = w.kind.startsWith('simple');
  if (ids.some((id: string) => ['barbaro','guerreiro','paladino','patrulheiro'].includes(id))) return true;
  if (['guerra','tempestade'].includes(subclass(c,'clerigo',E))) return true;
  if (subclass(c,'bardo',E) === 'bravura' && level(c,'bardo') >= 3) return true;
  if (simple && (['bardo','bruxo','clerigo','ladino','monge'].includes(primary) || ids.slice(1).some((id: string) => ['bruxo','monge'].includes(id)))) return true;
  const key = norm(w.name);
  if (['bardo','ladino'].includes(primary) && ['besta de mao','espada longa','espada curta','rapieira'].includes(key)) return true;
  if (['druida','mago','feiticeiro'].includes(primary)) {
    const list = primary === 'druida' ? ['adaga','azagaia','bordao','cimitarra','clava','dardo','funda','foice','lança','lanca'] : ['adaga','dardo','funda','bordao','besta leve'];
    if (list.includes(key)) return true;
  }
  if (ids.includes('monge') && key === 'espada curta') return true;
  const race = norm(E.options.races[c.rules?.raceId]?.name || c.race);
  if (race.includes('anao') && ['machado de batalha','machadinha','martelo leve','martelo de guerra'].includes(key)) return true;
  if ((race.includes('alto elfo') || race.includes('elfo da floresta')) && ['espada longa','espada curta','arco longo','arco curto'].includes(key)) return true;
  if (race.includes('drow') && ['rapieira','espada curta','besta de mao'].includes(key)) return true;
  if (selections(c,E,'featWeapons').concat(selections(c,E,'racialFeatWeapons')).some((x: string) => norm(x) === key)) return true;
  const manual = norm(c.proficiencies?.weapons);
  return manual.includes(key) || /simples/.test(manual) && simple || /marciais/.test(manual) && !simple;
}
export interface WeaponResult extends Sheet {bonus:string;damage:string;explanation:string;extras:{name:string;formula:string;condition:string}[]}
export function weaponStats(c: Sheet, entry: Sheet, E: Engine):WeaponResult {
  const w = catalogueWeapon(entry,E);
  if (!w || entry.calculationMode === 'manual') return { ...entry, bonus:String(entry.bonus ?? '+0'),damage:String(entry.damage ?? '0'),calculationMode:'manual', explanation:'Valores manuais preservados. Escolha uma arma do catálogo para calcular automaticamente.', extras:[] };
  const rangedWeapon = w.kind.endsWith('Ranged'), thrown = entry.attackMode === 'thrown' && /arremesso/i.test(w.properties), meleeAttack = !rangedWeapon && !thrown;
  const monk = level(c,'monge'), monkWeapon = monk > 0 && !c.armorEquipped && !c.shieldEquipped && (norm(w.name) === 'espada curta' || w.kind === 'simpleMelee' && !/pesada|duas mãos/i.test(w.properties));
  const str = ability(c,'str'), dex = ability(c,'dex'), canDex = /acuidade/i.test(w.properties) || monkWeapon;
  const key = entry.abilityOverride === 'str' || entry.abilityOverride === 'dex' ? entry.abilityOverride : rangedWeapon ? 'dex' : canDex && dex > str ? 'dex' : 'str';
  const modifier = ability(c,key), proficient = isProficient(c,entry,w,E), pb = proficient ? proficiency(c) : 0;
  const namedMagic = String(entry.name).match(/\+([1-3])\b/);
  const magic = Number(entry.magicBonus ?? namedMagic?.[1] ?? 0);
  const styles = selections(c,E,'fighting').concat(selections(c,E,'championFighting'));
  const rage = level(c,'barbaro') && active(c,'barbaro:rage') && meleeAttack && key === 'str' && E.armorInfo(c.armorEquipped)?.type !== 'pesada' ? level(c,'barbaro') >= 16 ? 4 : level(c,'barbaro') >= 9 ? 3 : 2 : 0;
  const sacred = level(c,'paladino') >= 3 && subclass(c,'paladino',E) === 'devocao' && active(c,'paladino:sacredWeapon') && c.ruleState?.targets?.['paladino:sacredWeapon'] === entry.name ? Math.max(1,ability(c,'cha')) : 0;
  const archery = rangedWeapon && styles.includes('Arquearia') ? 2 : 0;
  const twoHands = /duas mãos/i.test(w.properties) || entry.hands === 2;
  const duel = meleeAttack && !twoHands && !entry.offHand && styles.includes('Duelismo') && entry.duelingEligible === true ? 2 : 0;
  const attack = modifier + pb + magic + sacred + archery + Number(entry.attackAdjustment || 0);
  let die = w.damage;
  if (twoHands && /vers[aá]til/i.test(w.properties)) die = w.properties.match(/vers[aá]til\s*\((\d+d\d+)\)/i)?.[1] || die;
  if (monkWeapon) {
    const sides = monk >= 17 ? 10 : monk >= 11 ? 8 : monk >= 5 ? 6 : 4;
    if (/^1d\d+$/.test(die) && Number(die.slice(2)) < sides) die = '1d'+sides;
  }
  const damageBonus = (entry.offHand && !styles.includes('Combate com Duas Armas') ? Math.min(0,modifier) : modifier) + magic + rage + duel + Number(entry.damageAdjustment || 0);
  const improvedSmite = level(c,'paladino') >= 11 && !rangedWeapon ? '+1d8' : '';
  const damage = die === '0' ? '0' : die + improvedSmite + (damageBonus < 0 ? '' : '+') + damageBonus;
  const extras = [];
  if (level(c,'ladino') && (rangedWeapon || /acuidade/i.test(w.properties))) extras.push({name:'Ataque Furtivo',formula:`${Math.ceil(level(c,'ladino')/2)}d6`,condition:'Uma vez por turno; vantagem ou aliado elegível junto do alvo, sem desvantagem.'});
  if (level(c,'paladino') >= 2 && meleeAttack) extras.push({name:'Destruição Divina',formula:'2d8',condition:'Após acertar, gaste espaço: +1d8 por nível acima do 1º (máx. 5d8), +1d8 contra morto-vivo/corruptor.'});
  if (selections(c,E,'hunter').includes('Assassino de Colossos')) extras.push({name:'Assassino de Colossos',formula:'1d8',condition:'Uma vez por turno, contra criatura que já está abaixo dos PV máximos.'});
  if (meleeAttack && level(c,'barbaro') >= 9) extras.push({name:'Crítico Brutal',formula:`${level(c,'barbaro') >= 17 ? 3 : level(c,'barbaro') >= 13 ? 2 : 1}d${die.match(/d(\d+)/)?.[1] || 6}`,condition:'Somente no acerto crítico corpo a corpo; não exige Fúria.'});
  const critical = subclass(c,'guerreiro',E) === 'campeao' && level(c,'guerreiro') >= 3 ? level(c,'guerreiro') >= 15 ? 18 : 19 : 20;
  return { ...entry, ruleWeapon:w.name, proficient, magicBonus:magic, bonus:(attack >= 0 ? '+' : '')+attack, damage, dmgTypeLabel:w.damageType, properties:w.properties, category:w.kind, critical, ability:key, extras,
    explanation:`Ataque: ${key.toUpperCase()} ${modifier >= 0 ? '+' : ''}${modifier} + proficiência ${pb} + magia ${magic} + Arquearia ${archery} + Arma Sagrada ${sacred}${entry.attackAdjustment ? ' + ajuste '+entry.attackAdjustment : ''} = ${attack}. Dano: ${die}${improvedSmite} + habilidade ${modifier} + magia ${magic} + Fúria ${rage} + Duelismo ${duel}${entry.damageAdjustment ? ' + ajuste '+entry.damageAdjustment : ''}. ${w.properties}. Crítico: ${critical}–20.` };
}

export function armorClass(c: Sheet, E: Engine) {
  const dex = ability(c,'dex'), armor = E.armorInfo(c.armorEquipped), wearing = !!armor && armor.type !== 'shield';
  const armorMagic = Number(c.armorMagicBonus ?? String(c.armorEquipped).match(/\+([1-3])\b/)?.[1] ?? 0);
  const shieldMagic = Number(c.shieldMagicBonus ?? String(c.shieldName).match(/\+([1-3])\b/)?.[1] ?? 0);
  const shield = c.shieldEquipped ? 2 + shieldMagic : 0;
  const choices: { id:string; label:string; base:number; formula:string; shield:boolean }[] = [];
  const add = (id:string,label:string,base:number,formula:string,allowShield = true) => choices.push({id,label,base,formula,shield:allowShield});
  if (wearing) {
    const mediumMaster = selections(c,E,'feat').concat(selections(c,E,'racialFeat')).some((x:string) => ['maestria em armadura media','mestre de armaduras medias'].includes(norm(x)));
    const cap = armor.type === 'media' && mediumMaster ? 3 : armor.dexCap;
    const contribution = cap ? Math.min(dex,cap) : 0;
    add('armor',c.armorEquipped,armor.base + contribution + armorMagic,`${armor.base} + DES ${contribution} + magia ${armorMagic}`);
  } else {
    add('unarmored','Sem armadura',10+dex,`10 + DES (${dex})`);
    const owner = E.unarmoredDefense(c);
    if (owner === 'barbaro') add('barbarian','Defesa sem Armadura · Bárbaro',10+dex+ability(c,'con'),`10 + DES (${dex}) + CON (${ability(c,'con')})`);
    if (owner === 'monge' && !c.shieldEquipped) add('monk','Defesa sem Armadura · Monge',10+dex+ability(c,'wis'),`10 + DES (${dex}) + SAB (${ability(c,'wis')})`,false);
    if (subclass(c,'feiticeiro',E) === 'draconica') add('draconic','Resiliência Dracônica',13+dex,`13 + DES (${dex})`);
    if (c.mageArmorActive) add('mageArmor','Armadura Arcana',13+dex,`13 + DES (${dex})`);
    if (c.rules?.legacy && Number.isFinite(c.baseAcArmor)) add('legacy','Base manual importada',c.baseAcArmor,String(c.baseAcArmor));
  }
  const styles = selections(c,E,'fighting').concat(selections(c,E,'championFighting'));
  const defense = wearing && styles.includes('Defesa') ? 1 : 0;
  const spellBonuses = (active(c,'spell:shieldOfFaith') ? 2 : 0) + (active(c,'spell:shield') ? 5 : 0);
  const flat = defense + spellBonuses + Number(c.acAdjustment || 0);
  const options = choices.map(x => ({...x, total:x.base + (x.shield ? shield : 0) + flat}));
  const chosen = options.find(x => x.id === c.acFormula) || options.reduce((a,b) => a.total >= b.total ? a : b);
  return { total:chosen.total, chosen:chosen.id, options, explanation:`${chosen.label}: ${chosen.formula} + escudo ${chosen.shield ? shield : 0} + Defesa ${defense} + magias ${spellBonuses} + ajustes ${Number(c.acAdjustment || 0)} = ${chosen.total}. Fórmulas alternativas não se somam. Escudo Arcano: até seu próximo turno; Escudo da Fé exige concentração.` };
}
export function exhaustion(c: Sheet) {
  const value = Math.max(0,Math.min(6,Math.floor(Number(c.exhaustion) || 0)));
  const penalties = ['Desvantagem em testes de habilidade','Deslocamento pela metade','Desvantagem em ataques e testes de resistência','PV máximos pela metade','Deslocamento 0','Morte'];
  return {level:value, penalties:penalties.slice(0,value), speed:value >= 5 ? 0 : Math.max(0,Number(c.speed || 0)) / (value >= 2 ? 2 : 1), hpMax:hitPointMaximum(c)};
}
/** Proteção Arcana, forma de besta, PV temporários e PV reais são reservas separadas. */
export function applyDamage(c: Sheet, amount: number, options:{critical?:boolean;survival?:SurvivalChoice}={critical:false}) {
  if (!Number.isFinite(amount)) throw new Error('Informe uma quantidade finita de dano.');
  let damage = Math.max(0,Math.floor(amount));
  const ward=arcaneWardPoints(c),absorbed=ward>0?Math.min(ward,damage):0;
  const survival=previewSurvival(c,damage-absorbed,options.survival);
  if(absorbed)c.ruleState.pools['mago:ward']-=absorbed;
  return applyBodyDamage(c,damage-absorbed,!!options.critical,absorbed,survival);
}
/** O modo por tipo calcula tudo antes de alterar reservas. Não passa a proteção
 * duas vezes e gera apenas um teste de concentração/falha de morte por evento. */
export function applyTypedDamage(c:Sheet,packet:DamagePacket,E:Engine,choice?:SurvivalChoice) {
  const plan=previewTypedDamage(c,packet,E);
  const survival=previewSurvival(c,plan.received,choice);
  if(plan.ward)c.ruleState.pools['mago:ward']-=plan.ward;
  return {...plan,absorption:applyBodyDamage(c,plan.received,plan.critical,plan.ward,survival),survival};
}
function applyBodyDamage(c:Sheet,received:number,critical:boolean,ward:number,survival:SurvivalPlan=null) {
  let damage=received;
  const wasAtZero=c.hpCurrent===0,wasShape=level(c,'druida')>=2 && active(c,'druida:wildShape');
  const result={ward,temp:0,beast:0,hp:0,excess:0};
  // Temporários protegem os PV atuais, inclusive os da besta; a proteção é externa.
  result.temp=Math.min(c.hpTemp,damage); c.hpTemp-=result.temp; damage-=result.temp;
  if (level(c,'druida')>=2 && active(c,'druida:wildShape')) {
    const beast = Math.max(0,Number(c.ruleState.pools['druida:wildShape'] || 0)), n = Math.min(beast,damage);
    c.ruleState.pools['druida:wildShape'] -= n; damage -= n; result.beast=n;
    if (c.ruleState.pools['druida:wildShape'] <= 0) c.ruleState.active['druida:wildShape'] = false;
  }
  result.hp=Math.min(c.hpCurrent,damage);result.excess=damage-result.hp;
  commitSurvival(c,survival);
  if(survival?.saved) {result.hp=Math.max(0,c.hpCurrent-1);result.excess=0;c.hpCurrent=1;}
  else c.hpCurrent = Math.max(0,c.hpCurrent-damage);
  trackDamageAtZero(c,wasShape?damage:received,result.excess,wasAtZero,critical);
  queueConcentrationDamage(c,received,wasShape);
  return result;
}
/** Ajuste permanente conserva o dano já sofrido, sem reconstruir PV manuais. */
export function changePermanentAbility(c:Sheet,key:string,delta:number) {
  if (!['str','dex','con','int','wis','cha'].includes(key) || !Number.isInteger(delta)) return;
  const oldMod=ability(c,key),oldMax=exhaustion(c).hpMax,oldScore=c.abilities[key].score;
  const adapted=c.rules?.abilityMethod==='adapted';
  c.abilities[key].score=Math.max(adapted?0:1,Math.min(adapted?30:Math.max(24,oldScore),oldScore+delta));
  if (key!=='con') return;
  const gain=(ability(c,key)-oldMod)*c.classes.reduce((n:number,x:Sheet)=>n+x.level,0);
  c.hpMax=Math.max(1,c.hpMax+gain);
  if (c.hpCurrent>0) c.hpCurrent=Math.max(0,Math.min(exhaustion(c).hpMax,c.hpCurrent+exhaustion(c).hpMax-oldMax));
  syncIncapacity(c);
}
export function initiativeBonus(c:Sheet,E:Engine) {
  const feats=selections(c,E,'feat').concat(selections(c,E,'racialFeat'));
  const half=level(c,'bardo')>=2 || level(c,'guerreiro')>=7 && subclass(c,'guerreiro',E)==='campeao';
  return ability(c,'dex')+(half?Math.floor(proficiency(c)/2):0)+(feats.includes('Alerta')?5:0);
}
export function savingThrow(c: Sheet, key:string, E:Engine) {
  return savingThrowBonus(c,key);
}
export function movementWithEffects(c:Sheet,base:number) {
  return conditionSpeed(c,base+(active(c,'mago:stone') && c.ruleState?.targets?.['mago:stone']==='speed'?3:0));
}
export function concentrationSaveDetails(c:Sheet,E:Engine,options:{mode:'normal'|'adv'|'dis';damage:boolean;extra?:number;shapeBonus?:number}) {
  const extra=options.extra ?? 0;
  if(!Number.isInteger(extra) || Math.abs(extra)>100 || options.shapeBonus!==undefined && (!Number.isInteger(options.shapeBonus) || Math.abs(options.shapeBonus)>100))throw new Error('Confira os bônus de Constituição.');
  const warcaster=options.damage && selections(c,E,'feat').concat(selections(c,E,'racialFeat')).includes('Conjurador de Guerra');
  const inspired=!!(c.heroicInspiration && c.ruleState?.inspirationReady);
  const advantage=options.mode==='adv' || warcaster || inspired,disadvantage=options.mode==='dis' || Number(c.exhaustion)>=3;
  return {bonus:(options.shapeBonus ?? savingThrow(c,'con',E))+extra,mode:advantage===disadvantage?'normal':advantage?'adv':'dis',warcaster,inspired,exhausted:Number(c.exhaustion)>=3} as const;
}
