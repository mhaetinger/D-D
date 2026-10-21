import { norm, type Engine, type Sheet } from '../rules/model';
import { catalogueWeapon } from '../rules/combat';
import { preparation } from '../rules/spellcasting';
import { validateCharacters, type Backup } from '../storage/validation';
import {parseDiceFormula} from '../rules/dice-formula';

const compact=(s:unknown)=>norm(s).replace(/ /g,'');
export function matchOption(value:unknown,options:Record<string,Sheet>):string {
  const key=compact(value);if(!key)return '';
  const matches=Object.entries(options).filter(([id,o])=>compact(id)===key || compact(o.name)===key);
  return matches.length===1?matches[0][0]:'';
}
const spellAliases:Record<string,string>={'nevoa de adagas':'nuvem-de-adagas','invocar familiar':'convocar-familiar','bruxaria hex':'bruxaria'};
export function findSpell(value:unknown,E:Engine):Sheet|null {
  return E.spell(String(value || '')) || E.spell(spellAliases[norm(value)]) || null;
}
/** Apenas uma proposta em cópia. Ler/revisar nunca migra o original ou escolhe
 * uma sub-raça, juramento ou preparação que o documento não informou. */
export function proposeImport(backup:Backup,E:Engine):Backup {
  const copy=structuredClone(backup);
  for(const c of copy.characters as Sheet[]) {
    c.rules ||= {history:[],legacy:true};c.rules.history ||= [];
    const race=matchOption(c.rules.raceId,E.options.races)||(c.rules.manualMode?'':matchOption(c.race,E.options.races));
    if(race)c.rules.raceId=race;
    for(const cls of c.classes) {
      const options=E.data.classes[cls.classId]?.subclasses || {};
      const id=matchOption(cls.subclassId,options)||matchOption(cls.subclass,options);
      if(id)cls.subclassId=id;
    }
    for(const s of c.spells) {
      const entry=s.customSpell?null:findSpell(s.bookId,E)||findSpell(s.name,E);
      if(entry)s.bookId=entry.id;
      // Uma origem já explícita prevalece sobre a lista genérica do catálogo.
      if(!s.classId && entry && !s.importOriginNeedsConfirmation) {
        const candidates=c.classes.filter((x:Sheet)=>entry.classes?.includes(x.classId));
        if(candidates.length===1)s.classId=candidates[0].classId;
      }
    }
  }
  return copy;
}
/** O histórico conserva a lista textual legada a partir das mesmas explicações
 * exibidas por setor, sem duas fontes de avisos com significados diferentes. */
export function importWarnings(c:Sheet,E:Engine):string[]{
  return importNotices(c,E).map(n=>n.title+': '+n.detail);
}
/** Além do formato de armazenamento, confere vínculos consumidos pelos
 * controles. Exceções da mesa precisam de origem explícita, sem apagar dados. */
export function validateImport(c:Sheet,E:Engine):void {
  validateCharacters([c]);
  if(!c.name.trim())throw new Error('Informe o nome do personagem.');
  for(const w of c.weapons)if(!parseDiceFormula(w.damage))throw new Error(`Confira a fórmula de dano de ${w.name}.`);
  for(const s of c.spells) {
    if(!Number.isInteger(s.circle))throw new Error(`Confira o círculo de ${s.name}.`);
    if(s.customRoll&&!parseDiceFormula(s.customRoll))throw new Error(`Confira a fórmula personalizada de ${s.name}.`);
    if(!c.classes.some((x:Sheet)=>x.classId===s.classId))throw new Error(`Escolha a origem de ${s.name}.`);
    if(s.castingAbility && !['str','dex','con','int','wis','cha'].includes(s.castingAbility))throw new Error(`Confira a habilidade de ${s.name}.`);
    if(s.extraSource && !s.castingAbility)throw new Error(`Informe a habilidade da origem especial de ${s.name}.`);
    if((s.atWill||s.limitedUse)&&!s.extraSource)throw new Error(`Informe a característica que concede usos especiais de ${s.name}.`);
    if(s.ritual&&(s.atWill||s.limitedUse))throw new Error(`Escolha somente uma forma especial de lançamento para ${s.name}.`);
    if(s.ritual && !s.extraSource && !E.spell(s.bookId||s.name)?.ritual)throw new Error(`Confirme uma origem especial para o ritual ${s.name}.`);
    if(s.limitedUse!==undefined && (!Number.isInteger(s.limitedUse)||s.limitedUse<1||!Number.isInteger(s.usesUsed||0)||(s.usesUsed||0)>s.limitedUse))throw new Error(`Confira os usos de ${s.name}.`);
    const entry=findSpell(s.bookId||s.name,E);
    if(entry && !entry.classes?.includes(s.classId) && !s.extraSource && !c.rules?.manualMode) {
      const sub=c.classes.find((x:Sheet)=>x.classId===s.classId)?.subclassId;
      const cls=c.classes.find((x:Sheet)=>x.classId===s.classId),tables=E.progression.subclassSpells?.[s.classId+':'+sub] || {};
      const included=Object.entries(tables).filter(([n])=>Number(n)<=cls.level).flatMap(([,list])=>list as any[]).some((id:any)=>id===entry.id || norm(id)===norm(entry.name));
      if(!included)throw new Error(`${s.name} não está na lista comum dessa classe. Confirme a subclasse ou informe a origem especial.`);
    }
  }
  for(const cls of c.classes) {
    const p=preparation(c,cls.classId,E);
    if(p.prepares && p.used>p.limit && !c.rules?.importPreparationAdapted && !c.rules?.manualMode && !c.rules?.fieldOverrides?.preparation)throw new Error(`${E.data.classes[cls.classId].name}: ${p.used} preparadas, limite ${p.limit}. Ajuste o preparo ou identifique a adaptação da mesa.`);
  }
  for(const slot of Object.values(c.standardSlots) as Sheet[])if(!Number.isInteger(slot.total)||!Number.isInteger(slot.used)||slot.total<0||slot.used<0||slot.used>slot.total)throw new Error('Confira os espaços totais e usados de Conjuração.');
  for(const key of ['pactMagic','sorceryPoints']) {
    const pool=c[key],max=key==='pactMagic'?pool.total:pool.max,used=key==='pactMagic'?pool.used:pool.current;
    if(!Number.isInteger(max)||!Number.isInteger(used)||max<0||used<0||used>max)throw new Error('Confira as reservas de Pacto e Feitiçaria.');
  }
}

export function emptyImportedCharacter():Sheet {
  return {id:'pdf_'+crypto.randomUUID(),name:'',playerName:'',race:'',background:'',alignment:'',preferredLayout:'classic_2014',xp:0,size:'Médio',speed:0,heroicInspiration:false,shieldEquipped:false,armorEquipped:null,baseAcArmor:10,mageArmorActive:false,hpCurrent:0,hpMax:0,hpTemp:0,tidesOfChaosAvailable:true,
    abilities:Object.fromEntries(['str','dex','con','int','wis','cha'].map(k=>[k,{score:0,saveProf:false}])),skillsProf:[],expertise:[],customSkillBonuses:{},classes:[],pactMagic:{level:1,total:0,used:0},standardSlots:{},sorceryPoints:{current:0,max:0},weapons:[],spells:[],features:[],proficiencies:{weapons:'',tools:'',languages:''},coins:{pc:0,pp:0,pe:0,po:0,pl:0},inventoryItems:[],physical:{age:'',height:'',weight:'',eyes:'',skin:'',hair:''},lore:{traits:'',ideals:'',bonds:'',flaws:'',appearance:'',allies:'',treasure:'',backstory:''},rules:{version:1,history:[],legacy:true}};
}
/** Proposta de reservas para PDFs que não as expõem. Os usos atuais permanecem
 * editáveis na revisão; não é aplicada a backups que já têm suas reservas. */
export function suggestPdfPools(c:Sheet,E:Engine):void {
  const casters=c.classes.filter((x:Sheet)=>['bardo','clerigo','druida','feiticeiro','mago'].includes(x.classId) || ['paladino','patrulheiro'].includes(x.classId)&&x.level>=2 || ['guerreiro','ladino'].includes(x.classId)&&x.level>=3&&E.data.classes[x.classId].subclasses[x.subclassId]?.casting);
  const multiple=casters.length>1;
  const n=casters.reduce((total:number,x:Sheet)=>total+(['paladino','patrulheiro'].includes(x.classId)?(multiple?Math.floor(x.level/2):Math.ceil(x.level/2)):['guerreiro','ladino'].includes(x.classId)?(multiple?Math.floor(x.level/3):Math.ceil(x.level/3)):x.level),0);
  const row=E.progression.fullSlots[Math.max(0,n)] || [];
  c.standardSlots=Object.fromEntries(row.map((total:number,i:number)=>[i+1,{total,used:0}]).filter(([,s]:any)=>s.total>0));
  const warlock=c.classes.find((x:Sheet)=>x.classId==='bruxo')?.level || 0,total=warlock>=17?4:warlock>=11?3:warlock>=2?2:warlock?1:0;
  c.pactMagic={level:Math.min(5,Math.max(1,Math.ceil(warlock/2))),total,used:0};
  const sorcerer=c.classes.find((x:Sheet)=>x.classId==='feiticeiro')?.level || 0;
  c.sorceryPoints={max:sorcerer>=2?sorcerer:0,current:sorcerer>=2?sorcerer:0};
}

export type ImportNotice={sector:string;title:string;detail:string};
/** Explica consequências por setor, sem transformar valores preservados em um
 * único aviso genérico. As mensagens não autorizam descartar dados. */
export function importNotices(c:Sheet,E:Engine):ImportNotice[] {
  const notices:ImportNotice[]=[];
  if(c.acFormula==='legacy')notices.push({sector:'combat',title:'CA mantida como no arquivo',detail:'O total escrito foi preservado. Armadura e escudo precisam ser conferidos antes de ativar o cálculo automático.'});
  if(c.rules?.pdfImport||c.rules?.importReview?.source==='pdf')notices.push({sector:'equipment',title:'Equipamentos e características em texto',detail:'Nem todos os itens, talentos e escolhas de classe são convertidos em dados da ficha. Confira e cadastre os que faltarem nos blocos correspondentes: texto sozinho não calcula peso nem aplica efeitos. O texto extraído fica nas anotações pessoais, se você optar por incluí-las.'});
  if(c.rules?.pdfImport?.conflicts?.length)notices.push({sector:'identity',title:'Campos diferentes no PDF',detail:'Alguns campos repetidos têm valores diferentes. Confira os valores exibidos; as versões originais ficam no texto extraído, nas anotações pessoais, se incluídas.'});
  if(!E.options.races[c.rules?.raceId])notices.push({sector:'identity',title:'Raça mantida manualmente',detail:'O nome será preservado. Efeitos raciais dependem de um vínculo com o catálogo ou de ajustes feitos na ficha.'});
  for(const cls of c.classes){const meta=E.data.classes[cls.classId];if(meta&&cls.level>=meta.subLevel&&!meta.subclasses?.[cls.subclassId])notices.push({sector:'identity',title:meta.name+' · subclasse por conferir',detail:'Você pode escolher uma subclasse acima ou manter manual. Sem esse vínculo, os recursos específicos da subclasse não serão acrescentados automaticamente.'});}
  const manual=c.weapons.filter((w:Sheet)=>w.calculationMode==='manual'||!catalogueWeapon(w,E));
  if(manual.length)notices.push({sector:'equipment',title:'Ataques com valores fixos',detail:manual.map((w:Sheet)=>w.name).join(', ')+': os valores reconhecidos do arquivo foram preservados. Não acompanham mudanças de atributos ou proficiência. Armas podem ser vinculadas ao catálogo; ataques especiais, como sopros, precisam ser conferidos pela regra de sua origem.'});
  if(Object.values(c.customSkillBonuses||{}).some(v=>v!==undefined))notices.push({sector:'skills',title:'Totais de perícias preservados',detail:'Os números do arquivo substituem o cálculo automático. Ao evoluir, confira esses totais. Apagar um total manual retoma o cálculo da ficha.'});
  const custom=c.spells.filter((s:Sheet)=>s.customSpell||!findSpell(s.bookId||s.name,E));
  if(custom.length)notices.push({sector:'spells',title:'Magias personalizadas',detail:custom.map((s:Sheet)=>s.name||'Sem nome').join(', ')+': usam a fórmula e a descrição escritas. Abra o cartão para conferir ou escolher a magia correta no catálogo.'});
  if(c.spells.some((s:Sheet)=>s.circle>0&&!s.extraSource&&preparation(c,s.classId,E).prepares&&s.prepared!==true))notices.push({sector:'spells',title:'Magias não preparadas',detail:'Continuam no grimório. Para lançar normalmente, marque Preparada respeitando o limite da classe.'});
  return notices;
}

/** A comparação do livro altera somente máximos, nunca descansa o personagem.
 * Se um máximo não comporta usos/quantidades atuais, exige correção explícita. */
export function applySuggestedPools(c:Sheet,E:Engine):Sheet {
  const suggested=structuredClone(c);suggestPdfPools(suggested,E);
  for(let n=1;n<=9;n++){
    const old=c.standardSlots[n]||{total:0,used:0},total=suggested.standardSlots[n]?.total||0;
    if(old.used>total)throw new Error(`${n}º círculo: há ${old.used} espaços usados, mas o livro prevê ${total}. Corrija os usos antes de aplicar.`);
    suggested.standardSlots[n]={...old,total,used:old.used};delete suggested.standardSlots[n].created;
  }
  if(c.pactMagic.used>suggested.pactMagic.total)throw new Error('Os usos de Pacto superam o máximo calculado. Corrija os usos antes de aplicar.');
  if(c.sorceryPoints.current>suggested.sorceryPoints.max)throw new Error('Os pontos atuais de Feitiçaria superam o máximo calculado. Corrija-os antes de aplicar.');
  suggested.pactMagic.used=c.pactMagic.used;suggested.sorceryPoints.current=c.sorceryPoints.current;
  if(suggested.rules.fieldOverrides)for(const key of ['standardSlots','pactMagic','sorceryPoints'])delete suggested.rules.fieldOverrides[key];
  return suggested;
}
