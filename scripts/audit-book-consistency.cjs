// Check-up de leitura: não altera fichas, catálogos ou armazenamento.
// Executar: node --import tsx scripts/audit-book-consistency.cjs
// Código 0 significa diagnóstico concluído; veja summary.divergences.
// Casos divergentes são pendências, não expectativas para a suíte de aprovação.
const {isDeepStrictEqual}=require('node:util');
const {execFileSync}=require('node:child_process');
const E=require('../public/rules/character-engine');
const S=require('../public/rules/phb2014-spells');
const references=require('../public/rules/phb2014-references');
const {create,choose}=require('../tests/character-choices.cjs');
const {resourcesFor,toggleResource,spend,remaining}=require('../src/rules/resources.ts');
const {weaponStats,changePermanentAbility,initiativeBonus}=require('../src/rules/combat.ts');
const {skillBonus}=require('../src/rules/passives.ts');
const {startConcentration,concentration}=require('../src/rules/concentration.ts');
const {takeRest}=require('../src/rules/rest.ts');
const {resolveSpellEffect,twinEligible}=require('../src/rules/spell-effects.ts');
const {parseDiceFormula}=require('../src/rules/dice-formula.ts');
const {editSheetField}=require('../src/sheet-edit/model.ts');

// Tabela de Conjuração de 2014, PDF local p. 166. Classes únicas de meio/terço
// usam arredondamento para cima; a soma de multiclasse tem regra diferente.
const fullSlots=[[],[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],
  [4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],
  [4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],
  [4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],
  [4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
function advance(c,id,sub){const d=E.context({},{},c,id);choose(d,sub);return E.levelUp(c,id,d.answers);}
function make(id,n,sub){let c=create(id,sub);while(c.classes[0].level<n)c=advance(c,id,sub);return c;}

function auditBookConsistency(){
  const checks=[];
  const record=(id,group,pages,expected,actual)=>checks.push({id,group,pages,expected,actual,matches:isDeepStrictEqual(expected,actual)});
  const pool=(c,id,max,recovery)=>{
    const r=resourcesFor(c,E).find(x=>x.id===id),key=`${c.classes[0].classId}/${c.classes[0].subclassId}/${c.classes[0].level}/${id}`;
    record(key,'reservas',[],{max:Number.isFinite(max)?max:'infinito',recovery},r?{max:Number.isFinite(r.max)?r.max:'infinito',recovery:r.recovery}:null);
    if(r&&Number.isFinite(max)){
      const spent=structuredClone(c);spend(spent,r);
      const short=structuredClone(spent),long=structuredClone(spent);takeRest(short,'short',E);takeRest(long,'long',E);
      record(key+'/gasto-e-recuperacao','recuperacao-efetiva',[],[max-1,recovery==='short'?max:max-1,max],[remaining(spent,r),remaining(short,r),remaining(long,r)]);
    }
  };
  let snapshots=0,featureLookups=0,racialTraits=0;
  const featureOccurrences=Object.values(E.data.classes).reduce((sum,cls)=>sum+Object.values(cls.features).flat().length+Object.values(cls.subclasses).reduce((n,sub)=>n+Object.values(sub.features).flat().length,0),0);
  for(const[id,cls]of Object.entries(E.data.classes))for(const[sub,details]of Object.entries(cls.subclasses)){
    let c=create(id,sub);
    for(let n=1;n<=20;n++){
      if(n>1)c=advance(c,id,sub);
      snapshots++;
      c.abilities.cha.score=16;c.abilities.wis.score=16;
      let caster=0;
      if(['bardo','clerigo','druida','feiticeiro','mago'].includes(id))caster=n;
      else if(['paladino','patrulheiro'].includes(id)&&n>=2)caster=Math.ceil(n/2);
      else if((id==='guerreiro'&&sub==='cavaleiroArcano'||id==='ladino'&&sub==='trapaceiroArcano')&&n>=3)caster=Math.ceil(n/3);
      const actual=Object.entries(c.standardSlots).filter(([,p])=>p.total>0).map(([circle,p])=>[Number(circle),p.total]);
      record(`${id}/${sub}/${n}/espacos`,'espacos',[166],fullSlots[caster].map((value,i)=>[i+1,value]),actual);
      if(id==='barbaro')pool(c,'barbaro:rage',n===20?Infinity:n>=17?6:n>=12?5:n>=6?4:n>=3?3:2,'long');
      if(id==='bardo')pool(c,'bardo:inspiration',3,n>=5?'short':'long');
      if(id==='clerigo'&&n>=2)pool(c,'shared:channel',n>=18?3:n>=6?2:1,'short');
      if(id==='paladino'){pool(c,'paladino:layHands',5*n,'long');if(n>=3)pool(c,'shared:channel',1,'short');}
      if(id==='druida'&&n>=2)pool(c,'druida:wildShape',n===20?Infinity:2,'short');
      if(id==='guerreiro'){
        pool(c,'guerreiro:secondWind',1,'short');
        if(n>=2)pool(c,'guerreiro:actionSurge',n>=17?2:1,'short');
        if(n>=9)pool(c,'guerreiro:indomitable',n>=17?3:n>=13?2:1,'long');
        if(sub==='mestreBatalha'&&n>=3)pool(c,'guerreiro:superiority',n>=15?6:n>=7?5:4,'short');
      }
      if(id==='monge'&&n>=2)pool(c,'monge:ki',n,'short');
      if(id==='bruxo'){
        record(`${id}/${sub}/${n}/pacto`,'pacto',[57],{total:n>=17?4:n>=11?3:n>=2?2:1,level:Math.min(5,Math.ceil(n/2))},{total:c.pactMagic.total,level:c.pactMagic.level});
        const short=structuredClone(c),long=structuredClone(c);short.pactMagic.used=long.pactMagic.used=1;takeRest(short,'short',E);takeRest(long,'long',E);
        record(`${id}/${sub}/${n}/pacto-recuperacao`,'pacto-recuperacao',[57],[0,0],[short.pactMagic.used,long.pactMagic.used]);
      }
    }
    for(const table of [cls.features,details.features])for(const[level,names]of Object.entries(table))for(const name of names){
      featureLookups++;const ref=E.reference(name,id,sub);
      record(`${id}/${sub}/${level}/${name}`,'presenca-descricao',[],true,!!ref?.text?.trim());
    }
  }
  for(const[id,race]of Object.entries(E.options.races))for(const name of race.traits){racialTraits++;record(`${id}/${name}`,'presenca-racial',[],true,!!E.reference(name,null,id,'race')?.text?.trim());}
  for(const[id,bg]of Object.entries(E.options.backgrounds))record(id,'presenca-antecedente',[],true,!!E.reference(bg.feature,null,id,'background')?.text?.trim());
  for(const feat of E.options.feats)record(feat.name,'presenca-talento',[],true,!!E.reference(feat.name,null,null,'feat')?.text?.trim());
  for(const s of S)record(s.id,'presenca-magia',[s.pdfPage],true,['name','school','time','range','components','duration','text'].every(k=>typeof s[k]==='string'&&s[k].trim().length>0)&&Number.isInteger(s.level)&&s.level>=0&&s.level<=9);
  record('zona-sem-apendice','texto',[288,289],false,/APÊNDICE A|CONDIÇÕES|ATORDOADO|CEGO/.test(E.spell('Zona da Verdade').text));
  record('raio-solar-geometria','metadados',[273],'linha',E.spellMeta(E.spell('Raio Solar')).targetType);
  for(const name of ['Ilusão Menor','Mãos Mágicas','Imagem Silenciosa'])record(name+'/gemea','metamagia',[79],false,twinEligible(make('feiticeiro',3,'draconica'),E.toSheetSpell(E.spell(name),'feiticeiro'),E.spell(name).level,E));
  const mage=make('mago',20,'abjuracao');
  for(const[name,circle,expected,pages]of [
    ['Chuva de Meteoros',9,'20d6+20d6',[225]],['Tempestade de Gelo',4,'2d8+4d6',[285]],
    ['Coluna de Chamas',5,'4d6+4d6',[226]],['Raio de Bruxa',3,'3d12',[271]],
    ['Lâmina Flamejante',3,'3d6',[251,252]],['Lâmina Flamejante',4,'4d6',[251,252]],
    ['Arma Espiritual',3,'1d8',[218]],['Arma Espiritual',4,'2d8',[218]],
  ]){
    const result=resolveSpellEffect(mage,E.toSheetSpell(E.spell(name),'mago'),circle,E);
    record(`${name}/${circle}`,'formula',pages,parseDiceFormula(expected)?.counts,parseDiceFormula(result.formula)?.counts);
  }
  const destructive=resolveSpellEffect(mage,E.toSheetSpell(E.spell('Onda Destrutiva'),'paladino'),5,E);
  record('onda-destrutiva-rolavel','fonte-incompativel',[264],true,!!parseDiceFormula(destructive.formula));
  const evoker=make('mago',10,'evocacao');evoker.abilities.int.score=16;
  record('evocacao-potencializada','bonus',[99],'8d6+3',resolveSpellEffect(evoker,E.toSheetSpell(E.spell('Bola de Fogo'),'mago'),3,E).formula);
  const priest=make('clerigo',5,'vida');priest.abilities.wis.score=16;
  record('arma-espiritual-modificador','bonus',[218],'1d8+3',resolveSpellEffect(priest,E.toSheetSpell(E.spell('Arma Espiritual'),'clerigo'),2,E).formula);
  const champion=make('guerreiro',7,'campeao');champion.abilities.dex.score=14;champion.skillsProf=champion.skillsProf.filter(id=>id!=='acrobacia');
  record('atletismo-iniciativa-arredondamento','bonus',[84],4,initiativeBonus(champion,E));
  record('atletismo-acrobacia-sem-treino','bonus',[84],4,skillBonus(champion,{id:'acrobacia',ability:'dex'}));
  const cleric=make('clerigo',3,'enganacao');startConcentration(cleric,{name:'Bênção'});
  toggleResource(cleric,resourcesFor(cleric,E).find(r=>r.id==='clerigo:duplicate'),E);
  record('duplicidade-substitui-concentracao','concentracao',[67],false,concentration(cleric)?.name==='Bênção');
  const sorcerer=make('feiticeiro',18,'draconica');startConcentration(sorcerer,{name:'Voo'});
  toggleResource(sorcerer,resourcesFor(sorcerer,E).find(r=>r.id==='feiticeiro:presence'),E);
  record('presenca-substitui-concentracao','concentracao',[80],false,concentration(sorcerer)?.name==='Voo');
  toggleResource(sorcerer,resourcesFor(sorcerer,E).find(r=>r.id==='feiticeiro:wings'),E);takeRest(sorcerer,'short',E);
  record('asas-apos-descanso-curto','duracao',[80],true,sorcerer.ruleState.active['feiticeiro:wings']);
  const druid=make('druida',1);
  for(const name of ['Foice Curta','Porrete'])record(name+'/druida','proficiencia',[71],true,weaponStats(druid,{name},E).proficient);
  const fighter=make('guerreiro',5,'campeao'),viaButtons=structuredClone(fighter);
  changePermanentAbility(viaButtons,'con',2);
  const viaField=editSheetField(fighter,'abilities.con.score',String(fighter.abilities.con.score+2),E);
  record('con-digitada-e-botoes','pv',[178],viaButtons.hpMax,viaField.hpMax);
  const divergences=checks.filter(c=>!c.matches),groups={};
  for(const c of checks){const g=groups[c.group]||={checks:0,divergences:0};g.checks++;if(!c.matches)g.divergences++;}
  return {sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:require('node:path').join(__dirname,'..'),encoding:'utf8'}).trim(),
    scope:{classes:Object.keys(E.data.classes).length,subclasses:Object.values(E.data.classes).reduce((n,c)=>n+Object.keys(c.subclasses).length,0),snapshots,featureOccurrences,featureLookups,racialTraits,backgrounds:Object.keys(E.options.backgrounds).length,feats:E.options.feats.length,spells:S.length,references:references.length},
    summary:{checks:checks.length,passed:checks.length-divergences.length,divergences:divergences.length,groups},divergences};
}
module.exports={auditBookConsistency,makeAuditCharacter:make};
if(require.main===module){try{console.log(JSON.stringify(auditBookConsistency(),null,2));}catch(error){console.error(error);process.exitCode=1;}}
