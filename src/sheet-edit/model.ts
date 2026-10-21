import {removeClass,type ClassRemoval} from './class-removal';
import type {Engine,Sheet} from '../rules/model';
import {validateCharacters} from '../storage/validation';
import {emptyImportedCharacter,matchOption} from '../import/character-review';
import {active} from '../rules/model';
import {canEditSheet} from './access';
import {resourcesFor,used,remaining} from '../rules/resources';

const abilities=['str','dex','con','int','wis','cha'];
const textPaths=new Set(['name','playerName','race','background','alignment','size',...['weapons','tools','languages'].map(k=>'proficiencies.'+k),...['age','height','weight','eyes','skin','hair'].map(k=>'physical.'+k),...['traits','ideals','bonds','flaws','backstory','appearance','allies','treasure'].map(k=>'lore.'+k)]);
function number(raw:unknown,min:number,max=1e9,integer=true):number {
  const n=Number(raw);
  if(String(raw).trim()===''||!Number.isFinite(n)||n<min||n>max||integer&&!Number.isInteger(n))throw new Error(`Use ${integer?'um número inteiro':'um número'} entre ${min} e ${max}.`);
  return n;
}
export function fieldOverride(c:Sheet,key:string):void {
  c.rules ||= {version:1,history:[]};c.rules.fieldOverrides ||= {};c.rules.fieldOverrides[key]=true;
}
export function validateSheet(c:Sheet):Sheet {return validateCharacters([c])[0] as Sheet;}

/** Cada alteração é uma proposta validada. Não recalcula nem concede escolhas
 * ao corrigir um nível; a evolução guiada continua sendo uma ação explícita. */
export function editSheetField(original:Sheet,path:string,raw:unknown,E:Engine):Sheet {
  if(!canEditSheet(original))throw new Error('A edição desta ficha está bloqueada pelo mestre.');
  const c=structuredClone(original);let match:RegExpMatchArray|null;
  if(textPaths.has(path)) {
    const text=String(raw);if(text.length>16000)throw new Error('Use até 16.000 caracteres neste campo.');
    if(path==='name'&&!text.trim())throw new Error('Informe o nome do personagem.');
    const keys=path.split('.'),key=keys.pop()!;let target=c;for(const part of keys)target=target[part];target[key]=text;
    if(path==='race'){c.rules ||= {history:[]};c.rules.raceId=matchOption(text,E.options.races)||'';}
  }else if((match=path.match(/^abilities\.(str|dex|con|int|wis|cha)\.score$/)))c.abilities[match[1]].score=number(raw,0,30);
  else if((match=path.match(/^classes\.(\d+)\.(classId|level|subclassId|subclass)$/))) {
    const cls=c.classes[Number(match[1])],key=match[2];if(!cls)throw new Error('Esta classe mudou. Confira a ficha.');
    if(key==='level'){cls.level=number(raw,1,20);cls.hitDiceUsed=Math.min(cls.hitDiceUsed||0,cls.level);}
    else if(key==='classId') {
      if(!E.data.classes[String(raw)])throw new Error('Escolha uma classe do catálogo.');
      if(raw!==cls.classId&&c.spells.some((s:Sheet)=>s.classId===cls.classId))throw new Error('Reatribua as magias dessa classe antes de trocá-la. Você pode acrescentar a nova classe primeiro.');
      cls.classId=String(raw);cls.subclassId='';cls.subclass='';cls.hitDie=E.data.classes[cls.classId].die;
    }else if(key==='subclassId') {
      if(raw&&!E.data.classes[cls.classId].subclasses[String(raw)])throw new Error('Subclasse desconhecida.');
      cls.subclassId=String(raw);cls.subclass=E.data.classes[cls.classId].subclasses[String(raw)]?.name||'';
    }else {cls.subclass=String(raw);cls.subclassId=matchOption(raw,E.data.classes[cls.classId].subclasses)||'';}
  }else if((match=path.match(/^customSkillBonuses\.([a-z_]+)$/))) {
    if(!Object.hasOwn(E.data.skills,match[1]))throw new Error('Perícia desconhecida.');
    c.customSkillBonuses ||= {};
    if(String(raw).trim()==='')delete c.customSkillBonuses[match[1]];else c.customSkillBonuses[match[1]]=number(raw,-1000,1000);
  }else if((match=path.match(/^coins\.(pc|pp|pe|po|pl)$/)))c.coins[match[1]]=number(raw,0);
  else if(['hpCurrent','hpMax','hpTemp','speed','xp','armorTotal'].includes(path)) {
    const value=number(raw,path==='hpMax'?1:0,1e9,path!=='speed');
    if(path==='armorTotal') {
      // O número digitado é a CA atual. Equipamento/escudo não são somados de
      // novo; efeitos temporários continuam podendo entrar e sair normalmente.
      c.baseAcArmor=value-Number(c.acAdjustment||0)-(active(c,'spell:shieldOfFaith')?2:0)-(active(c,'spell:shield')?5:0);c.acFormula='written';fieldOverride(c,'armor');
    }else {c[path]=value;if(['hpMax','speed'].includes(path))fieldOverride(c,path);}
  }else if((match=path.match(/^standardSlots\.([1-9])\.(total|used|remaining)$/))) {
    const slot=c.standardSlots[match[1]] ||= {total:0,used:0},n=number(raw,0,100);slot[match[2]==='remaining'?'used':match[2]]=match[2]==='remaining'?slot.total-n:n;
    if(slot.used<0)throw new Error('Os espaços disponíveis não podem superar o total.');
    if(slot.used>slot.total)throw new Error('Os espaços usados não podem superar o total. Corrija os usos antes de diminuir o máximo.');
    // Corrigir usos não transforma espaços temporários de Conjuração Flexível
    // em permanentes, nem congela os máximos calculados pelo livro.
    if(match[2]==='total'){delete slot.created;fieldOverride(c,'standardSlots');}
  }else if((match=path.match(/^(pactMagic|sorceryPoints)\.(level|total|used|max|current|remaining)$/))) {
    const [group,key]=[match[1],match[2]],allowed=group==='pactMagic'?['level','total','used','remaining']:['max','current'];
    if(!allowed.includes(key))throw new Error('Campo de reserva inválido.');
    const n=number(raw,key==='level'?1:0,key==='level'?5:100);c[group][key==='remaining'?'used':key]=key==='remaining'?c[group].total-n:n;
    if(group==='pactMagic'?c[group].used>c[group].total||c[group].used<0:c[group].current>c[group].max)throw new Error('A quantidade atual/usada não pode superar o máximo. Ajuste-a primeiro.');
    if(['level','total','max'].includes(key))fieldOverride(c,group);
  }else if((match=path.match(/^resourceMax\.([A-Za-z0-9:_-]+)$/))) {
    const r=resourcesFor(c,E).find(r=>r.id===match![1]&&!r.cost&&['pool','counter','toggle'].includes(r.kind));if(!r)throw new Error('Recurso desconhecido ou compartilhado com outro controle.');
    c.rules ||= {history:[]};c.rules.resourceMaxOverrides ||= {};
    if(String(raw).trim()==='')delete c.rules.resourceMaxOverrides[r.id];
    else {const n=number(raw,0,100);if(r.kind==='pool'?remaining(c,r)>n:used(c,r)>n)throw new Error('Ajuste a reserva ou recupere usos antes de diminuir esse máximo.');c.rules.resourceMaxOverrides[r.id]=n;}
  }else if((match=path.match(/^inventoryItems\.(\d+)\.(name|qty|weightKg|description)$/))) {
    const item=c.inventoryItems[Number(match[1])];if(!item)throw new Error('Este item mudou.');
    const key=match[2];item[key]=['qty','weightKg'].includes(key)?number(raw,0,1e9,key==='qty'):String(raw);if(key==='weightKg')item.weightUnreviewed=false;
  }else throw new Error('Este campo não está disponível para edição.');
  return validateSheet(c);
}

export function changeClassList(original:Sheet,index:number|null,E:Engine,resolution?:ClassRemoval):Sheet {
  if(!canEditSheet(original))throw new Error('A edição desta ficha está bloqueada pelo mestre.');
  const c=structuredClone(original);
  if(index===null){const id=Object.keys(E.data.classes).find(id=>!c.classes.some((x:Sheet)=>x.classId===id));if(!id)throw new Error('Todas as classes já estão na ficha.');c.classes.push({classId:id,level:1,subclass:'',subclassId:'',hitDie:E.data.classes[id].die,hitDiceUsed:0});}
  else return validateSheet(removeClass(c,index,E,resolution));
  return validateSheet(c);
}
export function blankCharacter(playerName='Jogador',layout='classic_2014'):Sheet {
  const c=emptyImportedCharacter();c.id='blank_'+crypto.randomUUID();c.name='Novo personagem';c.playerName=playerName;c.preferredLayout=layout;
  c.hpMax=c.hpCurrent=1;c.speed=9;c.acFormula='written';c.armorProficiencies=[];
  for(const key of abilities)c.abilities[key].score=10;
  c.classes=[{classId:'guerreiro',level:1,subclass:'',subclassId:'',hitDie:10,hitDiceUsed:0}];
  c.rules.creationSource='blank';for(const key of ['armor','hpMax','speed','standardSlots','pactMagic','sorceryPoints'])fieldOverride(c,key);
  return c;
}
