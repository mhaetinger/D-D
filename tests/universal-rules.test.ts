import {test} from 'node:test';
import assert from 'node:assert/strict';
import {weaponStats,armorClass,applyDamage,exhaustion,savingThrow} from '../src/rules/combat';
import {resourcesFor,remaining,spend,refund,toggleResource,useResource,onSpellCast} from '../src/rules/resources';
import {takeRest} from '../src/rules/rest';
import {featureResourceBindings,resourcePlace,resourcesAt} from '../src/rules/placement';
import {canCastNormally,canRitual,preparation,slotTable} from '../src/rules/spellcasting';
import {normalizeCharacterText,readableText} from '../src/rules/text';
import {legacyBackupFormat,legacyKeyFor,migrateStorage} from '../src/storage/legacy';
import {CharacterStore,SHEET_KEY,RECOVERY_KEY} from '../src/storage/character-store';
import {ACTIVE_CHARACTER_KEY,readPreference} from '../src/storage/preferences';
import {parseBackup} from '../src/storage/validation';
import {compatibleDocuments,documentKey,projectDocuments} from '../src/sync/documents';
const E=require('../public/rules/character-engine');
const {setup,choose}=require('./character-choices.cjs');
const {warrior}=require('./fixture.cjs');
const make=(id:string,n:number,sub='')=>{
  const c=warrior(); c.classes=[{classId:id,level:n,subclassId:sub,subclass:E.data.classes[id].subclasses[sub]?.name || '',hitDie:E.data.classes[id].die,hitDiceUsed:0}];
  c.abilities.str.score=18;c.abilities.dex.score=14;c.abilities.con.score=16;c.abilities.int.score=16;c.abilities.wis.score=16;c.abilities.cha.score=16;
  for (const key of Object.keys(c.abilities)) c.abilities[key].saveProf=E.data.classes[id].saves.includes(key);
  c.armorEquipped=null;c.shieldEquipped=false;c.rules={history:[],raceId:'humano',legacy:false};c.proficiencies.weapons='';c.hpMax=40;c.hpCurrent=10;c.hpTemp=0;
  return c;
};
test('armas importadas reconhecem Martelo de Guerra, proficiência e bônus mágico sem duplicar',()=>{
  const c=make('guerreiro',5);
  assert.equal(weaponStats(c,{name:'Martelo de Guerra',damage:'1d8',bonus:'+0'},E).bonus,'+7');
  assert.equal(weaponStats(c,{name:'Martelo de Guerra +1',damage:'1d8',bonus:'+0'},E).bonus,'+8');
  assert.equal(weaponStats(c,{name:'Martelo de Guerra',proficient:false},E).bonus,'+4');
  assert.equal(weaponStats(c,{name:'Martelo de Guerra',hands:2},E).damage,'1d10+4');
  const mage=make('mago',5);assert.equal(weaponStats(mage,{name:'Martelo de Guerra'},E).bonus,'+4');
  assert.equal(weaponStats(mage,{name:'Martelo de Guerra',proficient:true},E).bonus,'+7');
  mage.race='Anão da Colina';mage.rules.raceId='';assert.equal(weaponStats(mage,{name:'Martelo de Guerra'},E).bonus,'+7');
});
test('catálogo completo de armas mantém propriedades e fórmulas válidas',()=>{
  const c=make('guerreiro',20,'campeao');
  for(const w of E.progression.weapons) {
    const result=weaponStats(c,{name:w.name,damage:w.damage,bonus:'+0'},E);
    assert.equal(result.ruleWeapon,w.name);assert.equal(result.proficient,true);
    assert.match(result.damage,/^(?:\d+|\d+d\d+)(?:[+-]\d+d\d+)*(?:[+-]\d+)?$/);
    assert.equal(result.properties,w.properties);assert.equal(result.critical,18);
  }
});
test('cada recurso tem um dono e controles existentes de magia não reaparecem nas características',()=>{
  const c=make('feiticeiro',6,'selvagem');c.rules.history=[{classId:'feiticeiro',level:3,answers:{metamagic:['Magia Acelerada','Magia Sutil']}}];
  const rs=resourcesFor(c,E);
  assert.equal(resourcePlace(c,rs.find(r=>r.id==='feiticeiro:sorcery')!),'reference');
  assert.equal(resourcePlace(c,rs.find(r=>r.id==='feiticeiro:meta-magia-acelerada')!),'existing');
  assert.equal(resourcePlace(c,rs.find(r=>r.id==='feiticeiro:bendLuck')!),'existing');
  assert.equal(resourcesAt(c,E,'features').length,0);
  for(const [id,cls] of Object.entries(E.data.classes) as any) for(const sid of Object.keys(cls.subclasses)) {
    const sheet=make(id,20,sid),bound=featureResourceBindings(sheet,E);
    const controls=[...bound.bindings.values()].flat().map(r=>r.id);
    assert.equal(bound.gains.length,E.features(sheet).length,`${id}/${sid}: reutiliza entradas existentes`);
    assert.equal(new Set(controls).size,controls.length);
    assert.deepEqual(controls.sort(),resourcesAt(sheet,E,'features').map(r=>r.id).sort());
  }
  const barb=make('barbaro',3,'berserker'),bound=featureResourceBindings(barb,E);
  assert.equal(bound.gains.length,E.features(barb).length,'ações reutilizam as características da classe');
  assert.equal(bound.gains.filter(g=>g.name==='Frenesi').length,1);
});
test('acuidade, arremesso, fúria e Arma Sagrada usam condições e reservas corretas',()=>{
  const c=make('barbaro',9,'berserker');c.abilities.dex.score=20;
  assert.ok(weaponStats(c,{name:'Machadinha'},E).extras.some(x=>x.name==='Crítico Brutal'));
  assert.ok(!weaponStats(c,{name:'Machadinha',attackMode:'thrown'},E).extras.some(x=>x.name==='Crítico Brutal'));
  const rage=resourcesFor(c,E).find((r:any)=>r.id==='barbaro:rage')!;
  toggleResource(c,rage,E);
  assert.equal(weaponStats(c,{name:'Machadinha'},E).damage,'1d6+7');
  assert.equal(weaponStats(c,{name:'Machadinha',attackMode:'thrown'},E).damage,'1d6+4');
  assert.equal(weaponStats(c,{name:'Adaga'},E).damage,'1d4+5');
  const p=make('paladino',3,'devocao');p.weapons=[{name:'Martelo de guerra'},{name:'Espada longa'}];
  p.ruleState={active:{},used:{},pools:{},targets:{'paladino:sacredWeapon':'Martelo de guerra'}};
  toggleResource(p,resourcesFor(p,E).find((r:any)=>r.id==='paladino:sacredWeapon')!,E);
  assert.equal(weaponStats(p,p.weapons[0],E).bonus,'+9');assert.equal(weaponStats(p,p.weapons[1],E).bonus,'+6');
  assert.equal(remaining(p,resourcesFor(p,E).find((r:any)=>r.id==='shared:channel')!),0);
});
test('frenesi não pode evitar exaustão desligando o subestado antes da fúria',()=>{
  const c=make('barbaro',3,'berserker'), rs=resourcesFor(c,E),rage=rs.find((r:any)=>r.id==='barbaro:rage')!,frenzy=rs.find((r:any)=>r.id==='barbaro:frenzy')!;
  assert.throws(()=>toggleResource(c,frenzy,E),/Fúria/);
  toggleResource(c,rage,E);toggleResource(c,frenzy,E);toggleResource(c,frenzy,E);toggleResource(c,rage,E);
  assert.equal(c.exhaustion,1);toggleResource(c,rage,E);toggleResource(c,rage,E);assert.equal(c.exhaustion,1);
});
test('resistência do Urso usa o Espírito Totêmico do nível 3, não escolhas posteriores',()=>{
  const c=make('barbaro',14,'totemico');
  c.rules.history=[{classId:'barbaro',level:3,answers:{totem:'Águia'}},{classId:'barbaro',level:6,answers:{totem:'Urso'}}];
  assert.ok(!resourcesFor(c,E).find(r=>r.id==='barbaro:totem')!.note.includes('todos os danos'));
  c.rules.history[0].answers.totem='Urso';
  assert.ok(resourcesFor(c,E).find(r=>r.id==='barbaro:totem')!.note.includes('todos os danos exceto psíquico'));
});
test('CA escolhe uma base e soma apenas bônus elegíveis; DES negativa continua valendo',()=>{
  const c=make('barbaro',5);assert.equal(armorClass(c,E).total,15);
  c.shieldEquipped=true;c.shieldMagicBonus=1;assert.equal(armorClass(c,E).total,18);
  c.mageArmorActive=true;assert.equal(armorClass(c,E).total,18);
  c.armorEquipped='Placas';assert.equal(armorClass(c,E).total,21);
  c.armorEquipped='Peitoral';c.abilities.dex.score=8;assert.equal(armorClass(c,E).total,16);
  c.ruleState={active:{'spell:shield':true,'spell:shieldOfFaith':true},used:{},pools:{}};
  assert.equal(armorClass(c,E).total,23);
  const monk=make('monge',5);assert.equal(armorClass(monk,E).total,15);
  monk.shieldEquipped=true;assert.equal(armorClass(monk,E).total,14);
});
test('a segunda Defesa sem Armadura não é adquirida por multiclasse',()=>{
  const c=make('barbaro',3);c.classes.push({classId:'monge',level:3,subclass:'',subclassId:''});c.abilities.wis.score=20;
  assert.ok(!armorClass(c,E).options.some((x:any)=>x.id==='monk'));assert.equal(armorClass(c,E).total,15);
});
test('Maestria em Armadura Média permite DES +3 sem somar fórmulas',()=>{
  const c=make('guerreiro',5);c.armorEquipped='Peitoral';c.abilities.dex.score=18;c.rules.history=[{classId:'guerreiro',level:4,answers:{feat:'Maestria em Armadura Média'}}];
  assert.equal(armorClass(c,E).total,17);
});
test('todas as armaduras do catálogo, incluindo acolchoada, têm fórmula reconhecida',()=>{
  const c=make('guerreiro',5);
  for (const item of E.equipmentCatalog().filter((x:any)=>x.category==='armaduras')) {
    const armor=E.armorInfo(item.name);assert.ok(armor,item.name);
    if (armor.type!=='shield') { c.armorEquipped=item.name; assert.equal(armorClass(c,E).chosen,'armor'); }
  }
  assert.deepEqual(E.armorInfo('Camisão de Malha'),E.armorInfo('Camisa de Malha'));
});
test('armadura e escudo mágicos importados reconhecem categoria sem duplicar o bônus',()=>{
  const c=make('guerreiro',5);c.armorEquipped='Armadura de placas +1';c.shieldEquipped=true;c.shieldName='Escudo +2';
  assert.equal(armorClass(c,E).total,23);c.armorMagicBonus=3;assert.equal(armorClass(c,E).total,25);
});
test('preparo por classe, sempre preparadas e ritual de mago sem lançamento normal',()=>{
  const c=make('mago',3);const s={name:'Detectar Magia',bookId:'detectar-magia',classId:'mago',circle:1,prepared:false,ritualAvailable:true};c.spells=[s];
  assert.equal(preparation(c,'mago',E).limit,6);assert.equal(canRitual(c,s,E),true);assert.equal(canCastNormally(c,s,E),false);
  s.prepared=true;assert.equal(canCastNormally(c,s,E),true);
  const cleric=make('clerigo',3);const domain={...s,classId:'clerigo',prepared:true,automatic:true,extraSource:'Magia de subclasse'};cleric.spells=[domain];
  assert.equal(preparation(cleric,'clerigo',E).used,0);assert.equal(canCastNormally(cleric,domain,E),true);
  assert.equal(canRitual(cleric,{...domain,prepared:false,automatic:false},E),false);
  const bard=make('bardo',3);assert.equal(canCastNormally(bard,{...s,classId:'bardo',prepared:false},E),true);
});
test('dano excedente atravessa proteção, temporários e forma antes dos PV reais',()=>{
  const c=make('druida',4,'lua');c.hpTemp=4;c.hpCurrent=30;c.ruleState={pools:{'mago:ward':5,'druida:wildShape':8},active:{'druida:wildShape':true}};
  c.classes.push({classId:'mago',level:2,subclassId:'abjuracao',subclass:'Escola de Abjuração'});
  applyDamage(c,20);assert.equal(c.hpTemp,0);assert.equal(c.hpCurrent,27);assert.equal(c.ruleState.active['druida:wildShape'],false);
});
test('primeira abjuração cria proteção; seguintes recarregam sem confundir PV temporários',()=>{
  const c=make('mago',4,'abjuracao');const spell={name:'Armadura Arcana',classId:'mago'};
  onSpellCast(c,spell,1,E);assert.equal(c.ruleState.pools['mago:ward'],11);applyDamage(c,5);
  onSpellCast(c,spell,1,E);assert.equal(c.ruleState.pools['mago:ward'],8);
  takeRest(c,'long',E);assert.equal(c.ruleState.pools['mago:ward'],0);
  onSpellCast(c,spell,1,E);assert.equal(c.ruleState.pools['mago:ward'],11);
});
test('Mestre Transmutador consome a pedra e encerra seu benefício',()=>{
  const c=make('mago',14,'transmutacao'),rs=resourcesFor(c,E),master=rs.find(r=>r.id==='mago:masterTransmuter')!,stone=rs.find(r=>r.id==='mago:stone')!;
  assert.throws(()=>toggleResource(c,master,E),/Pedra/);
  toggleResource(c,stone,E);c.ruleState.targets[stone.id]='constitution';assert.equal(savingThrow(c,'con',E),8);
  toggleResource(c,master,E);assert.equal(c.ruleState.active[stone.id],false);assert.equal(savingThrow(c,'con',E),3);
  toggleResource(c,master,E);assert.throws(()=>toggleResource(c,master,E),/Pedra/);
});
test('descansos respeitam origem, exaustão com alimento, presságios e Dados de Vida',()=>{
  const c=make('mago',14,'adivinhacao');c.exhaustion=3;c.classes[0].hitDiceUsed=10;
  const r=resourcesFor(c,E).find((r:any)=>r.id==='mago:arcaneRecovery')!;spend(c,r);takeRest(c,'short',E);
  assert.equal(remaining(c,r),0);takeRest(c,'long',E,{foodAndWater:false,tableHitDice:false},()=>.5);
  assert.equal(c.exhaustion,3);assert.equal(c.ruleState.portent.length,3);assert.ok(c.ruleState.portent.every((p:any)=>p.value===11));assert.equal(c.ruleState.hitDiceRecovery,7);
  takeRest(c,'long',E,{foodAndWater:true,tableHitDice:true});assert.equal(c.exhaustion,2);assert.equal(c.classes[0].hitDiceUsed,0);
});
test('descanso não revive morte por exaustão ao encerrar um Frenesi',()=>{
  const c=make('barbaro',3,'berserker');c.exhaustion=5;
  const rs=resourcesFor(c,E);toggleResource(c,rs.find(r=>r.id==='barbaro:rage')!,E);toggleResource(c,rs.find(r=>r.id==='barbaro:frenzy')!,E);
  assert.equal(takeRest(c,'long',E),false);assert.equal(c.exhaustion,6);assert.equal(c.hpCurrent,0);
  assert.throws(()=>takeRest(c,'short',E),/morte/);
});
test('aura do paladino adiciona CAR a resistências e não é somada se inconsciente',()=>{
  const c=make('paladino',6,'devocao');c.abilities.dex.saveProf=false;
  assert.equal(savingThrow(c,'dex',E),5);c.hpCurrent=0;assert.equal(savingThrow(c,'dex',E),2);
});
test('atalhos de Chi e feitiçaria usam a mesma reserva e recusam custos insuficientes',()=>{
  const c=make('monge',6,'sombras'),rs=resourcesFor(c,E),ki=rs.find(r=>r.id==='monge:ki')!,shadow=rs.find(r=>r.name==='Escuridão')!;
  useResource(c,shadow,E);assert.equal(remaining(c,ki),4);useResource(c,shadow,E);useResource(c,shadow,E);assert.throws(()=>useResource(c,shadow,E),/insuficientes/);
  const s=make('feiticeiro',6,'selvagem');s.sorceryPoints={current:3,max:6};const luck=resourcesFor(s,E).find(r=>r.id==='feiticeiro:bendLuck')!;
  useResource(s,luck,E);assert.equal(s.sorceryPoints.current,1);assert.throws(()=>useResource(s,luck,E));assert.equal(s.sorceryPoints.current,1);
});
test('Arcana Mística compartilha o uso entre magia e painel sem consumir Pacto',()=>{
  const c=make('bruxo',13,'arquifada');
  c.spells=[{classId:'bruxo',name:'Magia de sexto',circle:6,extraSource:'Arcana Mística',limitedUse:1,usesUsed:0},
    {classId:'bruxo',name:'Magia de sétimo',circle:7,extraSource:'Arcanum Místico',limitedUse:1,usesUsed:0}];
  const r=resourcesFor(c,E).find(r=>r.id==='bruxo:arcanum6')!;
  useResource(c,r,E);assert.equal(c.spells[0].usesUsed,1);assert.equal(remaining(c,r),0);assert.equal(c.spells[1].usesUsed,0);
  assert.throws(()=>useResource(c,r,E));refund(c,r);assert.equal(c.spells[0].usesUsed,0);
  c.spells[0].usesUsed=1;assert.equal(remaining(c,r),0);
  onSpellCast(c,c.spells[0],6,E);assert.equal(c.ruleState.used[r.id],1);
  takeRest(c,'short',E);assert.equal(remaining(c,r),0);
  takeRest(c,'long',E);assert.equal(remaining(c,r),1);assert.equal(c.spells[0].usesUsed,0);
});
test('recursos compartilhados não somam Canalizar e bloqueios de sete dias sobrevivem ao descanso',()=>{
  const c=make('clerigo',10,'vida');c.classes.push({classId:'paladino',level:3,subclassId:'devocao',subclass:'Juramento de Devoção'});
  const channels=resourcesFor(c,E).filter(r=>r.id==='shared:channel');assert.equal(channels.length,1);assert.equal(channels[0].max,2);
  c.ruleState={used:{},active:{},pools:{},targets:{},blockedUntil:{'clerigo:intervention':Date.now()+100_000}};
  takeRest(c,'long',E);assert.equal(remaining(c,resourcesFor(c,E).find(r=>r.id==='clerigo:intervention')!),0);
});
for(const [id,cls] of Object.entries(E.data.classes) as any) for(const sid of Object.keys(cls.subclasses)) test(`recursos ${id}/${sid}: níveis e isolamento`,()=>{
  for(const n of [1,2,3,5,6,10,14,18,20]) {
    const c=make(id,n,n>=cls.subLevel?sid:'');const rs=resourcesFor(c,E);
    assert.equal(new Set(rs.map(r=>r.id)).size,rs.length);
    for(const r of rs) {assert.equal(r.classId,id);assert.ok(r.max>=0);assert.ok(remaining(c,r)>=0);}
    const other=rs.filter(r=>r.kind!=='note' && !r.id.startsWith(id+':') && r.id!=='shared:channel');assert.deepEqual(other,[]);
  }
});
test('migração e importação reconhecem formatos históricos sem exportá-los novamente',()=>{
  const data=new Map<string,string>(),old=legacyKeyFor(SHEET_KEY),original=JSON.stringify({schemaVersion:1,characters:[warrior()]});data.set(old,original);
  const port={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)},removeItem:(k:string)=>{data.delete(k)}};
  const store=new CharacterStore(()=>port);const chars=store.read();assert.equal(chars.length,1);assert.equal(data.get(old),original);assert.equal(data.get(SHEET_KEY),original);
  const backup=parseBackup(JSON.stringify({...store.backup(chars),format:legacyBackupFormat}));assert.equal(backup.format,'critcall.character-backup');
  const broken=new CharacterStore(()=>({...port,setItem:()=>{throw new Error('quota')}}));data.delete(SHEET_KEY);assert.equal(broken.read().length,1);assert.equal(broken.issue?.kind,'write');
});
test('objetos são legíveis, entrada original fica preservada e projeção de aliases é compatível',()=>{
  const c=warrior();c.features=[{title:'Lembrete',description:'Texto recuperável'}];assert.equal(readableText(c.features[0]),'Lembrete: Texto recuperável');
  const migrated=normalizeCharacterText(c);assert.equal(migrated.features[0],'Lembrete: Texto recuperável');assert.equal(typeof c.features[0],'object');
  const data=new Map<string,string>();const port={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)},removeItem:(k:string)=>{data.delete(k)}};
  const old=legacyKeyFor('critcall_active_character_v1');const docs:any={old:{kind:'preference',id:old,value:'antigo'},fresh:{kind:'preference',id:'critcall_active_character_v1',value:c.id}};
  const compatible=compatibleDocuments(docs);assert.equal(Object.keys(compatible).length,1);projectDocuments(port,docs);assert.equal(data.get('critcall_active_character_v1'),c.id);
});
test('migração sem espaço mantém legível a preferência da ficha ativa antiga',()=>{
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  const old=legacyKeyFor(ACTIVE_CHARACTER_KEY);
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>k===old?'ficha-preservada':null,setItem:()=>{throw new Error('quota')},removeItem:()=>{}}});
  try { assert.equal(readPreference(ACTIVE_CHARACTER_KEY),'ficha-preservada'); }
  finally { if(descriptor) Object.defineProperty(globalThis,'localStorage',descriptor); else Reflect.deleteProperty(globalThis,'localStorage'); }
});
test('preços do mercado interpretam milhar brasileiro, moedas e orçamento sem compras gratuitas',()=>{
  const catalog=E.equipmentCatalog();
  assert.equal(catalog.find((x:any)=>x.name==='Luneta').costCp,100_000);
  assert.equal(catalog.find((x:any)=>x.name==='Armadura de placas').costCp,150_000);
  for(const i of catalog) assert.ok(Number.isSafeInteger(i.costCp) && i.costCp>0);
  const s={...setup('guerreiro'),equipmentMethod:'wealth',wealthGold:100,wealthPurchases:[{name:'Luneta',qty:1}]},d=E.context(s,{});choose(d);
  assert.throws(()=>E.create(s,d.answers),/excede|ouro|custo/i);
  for(const qty of [-1,0,1.5,Infinity,1001]) assert.throws(()=>E.create({...s,wealthGold:100_000,wealthPurchases:[{name:'Luneta',qty}]},d.answers),/quantidade|Compras/i);
});
test('modo adaptado conserva limites estruturais e riqueza aceita centavos exatos',()=>{
  const s={...setup('guerreiro'),abilityMethod:'adapted',baseScores:{str:18,dex:8,con:16,int:8,wis:10,cha:10},equipmentMethod:'wealth',wealthGold:.29,wealthPurchases:[]},d=E.context(s,{});choose(d);
  const c=E.create(s,d.answers);assert.equal(c.coins.pc,9);assert.equal(c.coins.pp,2);assert.equal(c.abilities.str.score,19);
  assert.throws(()=>E.create({...s,baseScores:{...s.baseScores,str:30}},d.answers),/Atributos/);
});
