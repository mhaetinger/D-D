import {norm,type Engine,type Sheet} from '../rules/model';
import {emptyImportedCharacter,findSpell,matchOption,suggestPdfPools} from './character-review';
import type {Backup} from '../storage/validation';
import type {CharacterPdf,PdfField} from './pdf-reader';

const key=(s:string)=>norm(s).replace(/ /g,'');
const integer=(s:unknown)=>/^[-+]?\d+$/.test(String(s).trim())?Number(s):null;
// Aceita apenas soma/subtração de inteiros escritos; nunca executa fórmulas do PDF.
const writtenTotal=(s:string)=>/^[+-]?\d+(?:\s*[+-]\s*\d+)*$/.test(s.trim())?s.replace(/\s/g,'').match(/[+-]?\d+/g)!.reduce((n,x)=>n+Number(x),0):undefined;
const checked=(f?:PdfField)=>!!f && !['','off','no','false','0'].includes(f.value.trim().toLowerCase());
const spellAliases:Record<string,string>={'nevoa de adagas':'nuvem-de-adagas','invocar familiar':'convocar-familiar','bruxaria hex':'bruxaria'};
function spellFromLine(value:string,E:Engine) {
  const text=norm(value);
  const entries=Object.values(E.spells) as Sheet[];
  const candidates=[...entries.map(s=>({prefix:norm(s.name),s})),...Object.entries(spellAliases).map(([prefix,id])=>({prefix,s:E.spell(id)}))].filter(x=>x.s && (text===x.prefix || text.startsWith(x.prefix+' '))).sort((a,b)=>b.prefix.length-a.prefix.length);
  return candidates[0]?.s || findSpell(value,E);
}
export function pdfToBackup(pdf:CharacterPdf,E:Engine):Backup {
  const c=emptyImportedCharacter(),fields=pdf.fields;
  // O primeiro campo não vazio prevalece; divergências de widgets repetidos
  // continuam no texto de origem, nunca são descartadas ou gravadas no original.
  const field=(...names:string[])=>fields.find(f=>names.some(n=>key(n)===key(f.name)) && f.value.trim()) || fields.find(f=>names.some(n=>key(n)===key(f.name)));
  const value=(...names:string[])=>field(...names)?.value.trim() || '';
  c.name=value('CharacterName','Nome do Personagem');c.playerName=value('PlayerName','Nome do Jogador');c.race=value('Race','Species','Raça','Espécie');c.background=value('Background','Antecedente');c.alignment=value('Alignment','Tendência');c.xp=integer(value('XP'))??0;c.size=value('Size','Tamanho')||'Médio';
  c.hpMax=integer(value('HPMax','HP Maximum'))??0;c.hpCurrent=integer(value('HPCurrent'))??undefined;c.hpTemp=integer(value('HPTemp'))??0;c.baseAcArmor=writtenTotal(value('AC','ArmorClass'));
  c.acFormula='legacy'; // Preserva o total escrito; não soma um escudo novamente.
  const speed=value('Speed','Deslocamento').match(/\d+(?:[.,]\d+)?/);c.speed=speed?Number(speed[0].replace(',','.')):undefined;
  c.rules.raceId=matchOption(c.race,E.options.races)||undefined;
  const header=value('ClassLevel','Class','Classe e nível','Classe'),level=value('Level','Nível');
  const classPieces=header.split(/[|/;,+]/).filter(s=>s.trim());
  for(const piece of classPieces) {
    const match=piece.trim().match(/^(.*?)(?:\s*(\d{1,2}))?$/);if(!match)continue;
    const id=matchOption(match[1],E.data.classes);if(!id)continue;
    // Um nível geral do cabeçalho não informa quantos níveis há em cada classe.
    const n=integer(match[2]||(classPieces.length===1?level:''));
    c.classes.push({classId:id,level:n??0,subclass:'',subclassId:'',hitDie:E.data.classes[id].die,hitDiceUsed:0});
  }
  if(c.classes.length===1) {
    const cls=c.classes[0],name=value('SubClass','Subclasse');cls.subclass=name;cls.subclassId=matchOption(name,E.data.classes[cls.classId].subclasses)||'';
  }
  const abilities:Record<string,string>={str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'};
  const markedBefore=(f?:PdfField)=>!!f && checked(fields.filter(x=>x.checkbox&&x.page===f.page&&x.x<f.x&&f.x-x.x<38&&Math.abs((x.y+x.height/2)-(f.y+f.height/2))<7).sort((a,b)=>b.x-a.x)[0]);
  for(const [k,name] of Object.entries(abilities)) {
    c.abilities[k].score=integer(value(k,k+'score',name))??undefined;
    c.abilities[k].saveProf=checked(field(k+'savePROF'))||markedBefore(field('ST '+name));
  }
  const skills=[['acro','Acrobatics','acrobacia'],['anhan','Animal','lidar_animais'],['arcana','Arcana','arcanismo'],['ath','Athletics','atletismo'],['decep','Deception','enganacao'],['hist','History','historia'],['insight','Insight','intuicao'],['intim','Intimidation','intimidacao'],['invest','Investigation','investigacao'],['med','Medicine','medicina'],['nature','Nature','natureza'],['per','Perception','percepcao'],['perf','Performance','atuacao'],['pers','Persuasion','persuasao'],['relig','Religion','religiao'],['soh','SleightofHand','prestidigitacao'],['stealth','Stealth','furtividade'],['surv','Survival','sobrevivencia']];
  for(const [short,full,id] of skills) {
    const f=field(full,short),bonus=integer(f?.value);
    if(bonus!==null)c.customSkillBonuses[id]=bonus;
    if(checked(field(short+'PROF'))||markedBefore(f))c.skillsProf.push(id);
  }
  for(const k of Object.keys(c.physical))c.physical[k]=value(k);
  const lore:Record<string,string>={traits:'PersonalityTraits',ideals:'Ideals',bonds:'Bonds',flaws:'Flaws',appearance:'Appearance',allies:'Allies',treasure:'Treasure',backstory:'Backstory'};
  for(const [k,name]of Object.entries(lore))c.lore[k]=value(name);
  c.proficiencies.languages=value('ProficienciesLang','Languages');
  const equipment=value('Equipment','Equipamento');if(equipment)c.inventoryItems.push({name:equipment,qty:1,weightKg:0});
  for(const [k,name]of Object.entries({pc:'CP',pp:'SP',pe:'EP',po:'GP',pl:'PP'}))c.coins[k]=integer(value(name))??0;
  for(const name of ['Features and Traits','FeaturesTraits','Feat+Traits','AttacksSpellcasting','ClassFeatures','SpeciesTraits','Feats']) {
    const text=value(name);if(text)c.features.push({name:'Texto importado do PDF',description:text});
  }
  for(let n=1;n<=12;n++) {
    const name=value('Wpn'+n+' Name',n===1?'Wpn Name':'Wpn Name '+n);if(!name)continue;
    const damageRaw=value('Wpn'+n+' Damage'),attackRaw=value('Wpn'+n+' AtkBonus');
    // Algumas fichas guardam o dado base na coluna de ataque e a alternativa
    // versátil nas notas/dano. Preserva o primeiro dado base sem somar bônus.
    const dieText=(/\bd\d+|\d+d\d+/i.test(attackRaw)?attackRaw+' '+damageRaw:damageRaw).match(/\b(?:\d+)?d\d+(?:\s*[+-]\s*\d+)*(?!\d)/i)?.[0]?.replace(/\s/g,'');
    const formula=dieText?.replace(/^d/i,'1d');
    if(!formula)continue; // Escudo ou linha sem dano continua no texto de origem.
    const bonus=integer(attackRaw);
    c.weapons.push({name,calculationMode:'manual',bonus:bonus===null?'':String(bonus>=0?'+':'')+bonus,damage:formula,notes:[damageRaw,value('Wpn'+n+' Notes'),bonus===null?'Bônus de ataque não identificado: confira na revisão.':''].filter(Boolean).join(' · ')});
  }
  const names=fields.filter(f=>/^(spells\d+|spellname\d+)$/i.test(key(f.name))&&f.value.trim());
  for(const f of names) {
    const entry=spellFromLine(f.value,E),explicit=c.classes.filter((cls:Sheet)=>new RegExp('(?:^| )'+norm(E.data.classes[cls.classId].name)+'(?: |$)').test(norm(f.value)));
    const candidates=entry?c.classes.filter((cls:Sheet)=>entry.classes?.includes(cls.classId)):[];
    const race=E.options.races[c.rules.raceId],total=c.classes.reduce((n:number,x:Sheet)=>n+x.level,0);
    const racial=entry && (Object.entries(race?.racialSpells||{}).some(([n,ids])=>Number(n)<=total&&(ids as string[]).includes(entry.id)) || race?.cantrip&&entry.level===0&&entry.classes?.includes(race.cantrip));
    const origin=explicit.length===1?explicit[0].classId:!racial&&candidates.length===1?candidates[0].classId:'';
    const s=entry?E.toSheetSpell(entry,origin):{name:f.value.trim(),classId:origin,circle:undefined,customRoll:'',dmgType:'livro',defType:'nenhuma',notes:f.value};
    if(racial&&explicit.length!==1)s.importOriginNeedsConfirmation=true;
    s.notes=[s.notes,f.value].filter(Boolean).join('\n');s.prepared=markedBefore(f);
    const row=f.name.match(/Spell Name (\d+)/i)?.[1];
    if(!entry&&row)s.circle=integer(value('Spell Level '+row))??undefined;
    if(row && checked(field('Spell R '+row))) {s.ritual=true;s.extraSource='Ritual indicado no PDF';s.castingAbility=E.data.classes[origin]?.ability || '';}
    c.spells.push(s);
  }
  suggestPdfPools(c,E);
  // Campos de slots de versões diferentes têm números internos diferentes e
  // podem misturar Conjuração/Pacto (ex.: "4/1"). A revisão mostra reservas
  // sugeridas por classe e exige conferir os usos, sem interpretar esse texto.
  const source=fields.filter(f=>f.value.trim()&&f.value!=='Off').map(f=>`[p. ${f.page}] ${f.name}: ${f.value}`).join('\n');
  if(source.length>1990000)throw new Error('O texto extraído do PDF ultrapassa o limite das anotações pessoais.');
  const repeated=new Map<string,Set<string>>();for(const f of fields){if(!f.value.trim()||f.value==='Off')continue;const values=repeated.get(key(f.name))||new Set<string>();values.add(f.value.trim());repeated.set(key(f.name),values);}
  c.rules.pdfImport={version:1,reviewRequired:true,conflicts:[...repeated].filter(([,values])=>values.size>1).map(([name])=>name)};
  return {format:'critcall.character-backup',version:1,exportedAt:'',characters:[c as any],privateNotes:{[c.id]:'Texto extraído do PDF original. Confira campos e valores antes de usar.\n\n'+source}};
}
