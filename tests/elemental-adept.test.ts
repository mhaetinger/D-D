import {test} from 'node:test';
import assert from 'node:assert/strict';
import {elementalAdeptTypes,applyElementalAdept,spellElementalAdept} from '../src/rules/elemental-adept';
import {evaluateDicePool} from '../src/rules/dice-roll';
import {parseDiceFormula} from '../src/rules/dice-formula';
import {resolveSpellEffect,spellDamageBreakdown} from '../src/rules/spell-effects';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs'),{setup,choose}=require('./character-choices.cjs');
function make(types=['Fogo']){
  const c=warrior();c.classes=[{classId:'feiticeiro',level:20,subclassId:'draconica'}];c.abilities.cha.score=16;
  c.rules={raceId:'humano',history:types.map((type,i)=>({classId:'feiticeiro',level:4+i*4,answers:{feat:'Adepto Elemental',featElement:type}}))};
  return c;
}
const spell=(id:string,extra={})=>E.toSheetSpell(E.spell(id),'feiticeiro',{prepared:true,...extra});
function roll(c:any,s:any,circle:number,die=(sides:number)=>1,options={}){
  const effect=resolveSpellEffect(c,s,circle,E,options),p=parseDiceFormula(effect.formula)!;
  const raw=evaluateDicePool(p.counts,p.modifier,'normal',{},die);
  const result=effect.elementalAdept?applyElementalAdept(raw,effect.elementalAdept):raw;
  return {effect,raw,result};
}

test('fonte de 2014 distingue resistência de imunidade e mantém escolha/repetição dos cinco elementos',()=>{
  const ref=E.reference('Adepto Elemental',null,null,'feat');assert.equal(ref.page,167);assert.equal(ref.pdfPage,166);
  assert.match(ref.text,/qualquer 1[\s\S]*como um 2/);assert.match(ref.text,/tipo diferente/);
  const c=make(['Ácido','Elétrico','Fogo','Frio','Trovejante']);
  assert.deepEqual(elementalAdeptTypes(c),['acido','eletrico','fogo','frio','trovejante']);
  c.rules.history.push({classId:'feiticeiro',level:20,answers:{feat:'Adepto Elemental',featElement:'Fogo'}});
  assert.equal(elementalAdeptTypes(c).length,5,'elementos repetidos não acumulam o mínimo');
});
test('elemento é vinculado ao evento do talento, respeitando classe/nível e sem inferir por notas',()=>{
  const c=make([]);c.notes='Adepto Elemental Fogo';c.rules.history=[
    {classId:'feiticeiro',level:4,answers:{feat:'Alerta',featElement:'Fogo'}},
    {classId:'feiticeiro',level:8,answers:{featElement:'Frio'}},
    {classId:'feiticeiro',level:12,answers:{feat:'Adepto Elemental'}},
    {classId:'mago',level:4,answers:{feat:'Adepto Elemental',featElement:'Ácido'}},
    {classId:'feiticeiro',level:21,answers:{feat:'Adepto Elemental',featElement:'Elétrico'}},
    {classId:'feiticeiro',level:1,answers:{racialFeat:'Adepto Elemental',racialFeatElement:'Trovão'}}];
  const before=JSON.stringify(c);assert.deepEqual(elementalAdeptTypes(c),['trovejante']);assert.equal(JSON.stringify(c),before);
});
test('criador permite conjurador, não permite repetir elemento e deixa de oferecer após os cinco',()=>{
  const config={...setup('feiticeiro'),allowFeats:true},d=E.context(config,{});choose(d,'draconica');
  let c=E.create(config,d.answers);
  for(let n=2;n<=20;n++){
    const next=E.context({},{},c,'feiticeiro'),type=['Ácido','Elétrico','Fogo','Frio','Trovejante'][E.data.classes.feiticeiro.asi.indexOf(n)];
    choose(next,'draconica',type?{advancement:'feat',feat:'Adepto Elemental',featElement:type}:{});
    if(type){assert.ok(E.requirements(next).find((f:any)=>f.id==='feat').options.some((o:any)=>o.value==='Adepto Elemental'));}
    c=E.levelUp(c,'feiticeiro',next.answers);
    if(n===4){
      const probe=E.context({},{},c,'feiticeiro');probe.level=8;probe.answers.advancement='feat';probe.answers.feat='Adepto Elemental';
      assert.ok(!E.requirements(probe).find((f:any)=>f.id==='featElement').options.some((o:any)=>o.value==='Ácido'));
    }
  }
  assert.equal(elementalAdeptTypes(c).length,5);
  c.rules.history.find((h:any)=>h.answers.featElement==='Trovejante').answers.featElement='Trovão';
  const probe=E.context({},{},c,'feiticeiro');probe.level=19;probe.answers.advancement='feat';
  assert.ok(!E.requirements(probe).find((f:any)=>f.id==='feat').options.some((o:any)=>o.value==='Adepto Elemental'));
  const orphan=structuredClone(c);orphan.rules.history.find((h:any)=>h.answers.featElement==='Fogo').answers.feat='Alerta';
  const recover=E.context({},{},orphan,'feiticeiro');recover.level=19;recover.answers.advancement='feat';recover.answers.feat='Adepto Elemental';
  assert.deepEqual(E.requirements(recover).find((f:any)=>f.id==='featElement').options.map((o:any)=>o.value),['Fogo'],'campo órfão não bloqueia adquirir o elemento');
  const noncaster=E.context({...setup('guerreiro'),allowFeats:true},{},warrior(),'guerreiro');noncaster.level=4;noncaster.answers.advancement='feat';
  assert.ok(!E.requirements(noncaster).find((f:any)=>f.id==='feat').options.some((o:any)=>o.value==='Adepto Elemental'));
});
test('cada elemento modifica dano da magia correspondente, sem novo RNG, alteração das faces ou bônus fixos',()=>{
  for(const [type,id]of [['Ácido','flecha-acida-de-melf'],['Elétrico','relampago'],['Fogo','bola-de-fogo'],['Frio','cone-de-frio'],['Trovejante','onda-trovejante']]){
    const c=make([type]),s=spell(id),before=JSON.stringify(c);let calls=0;
    const {effect,raw,result}=roll(c,s,s.circle,()=>{calls++;return 1;});
    assert.ok(effect.elementalAdept,id);const count=raw.groups.reduce((n,g)=>n+g.faces.length,0);
    assert.equal(calls,count);assert.equal(result.total,raw.total+count);assert.deepEqual(result.groups,raw.groups);
    assert.equal(result.modifier,raw.modifier);assert.equal(JSON.stringify(c),before);assert.match(result.breakdown.at(-1)!,/sem ignorar imunidade/);
    assert.equal(applyElementalAdept(result,effect.elementalAdept!),result,'não reaplicar');
  }
});
test('somente faces 1 mudam o total, sem alterar a fórmula, modo ou o resultado original',()=>{
  const c=make(),s=spell('maos-flamejantes'),faces=[1,2,6];
  const {effect,raw,result}=roll(c,s,1,()=>faces.shift()!);
  assert.equal(effect.formula,'3d6');assert.equal(raw.total,9);assert.equal(result.total,10);
  assert.deepEqual(raw.groups[0].faces,[1,2,6]);assert.equal(raw.elementalAdept,undefined);assert.equal(result.appliedMode,'normal');
  const high=roll(c,s,1,()=>6);assert.equal(high.result.total,18);assert.equal(high.result.elementalAdept?.adjustment,0);
});
test('nível superior, truque e Gêmea usam todos os dados elegíveis sem multiplicar o benefício por talento',()=>{
  const c=make(['Fogo','Frio']),cantrip=roll(c,spell('raio-de-fogo'),0);assert.equal(cantrip.effect.formula,'4d10');assert.equal(cantrip.result.total,8);
  const upcast=roll(c,spell('bola-de-fogo'),5);assert.equal(upcast.result.total,20);
  const twin=roll(c,spell('raio-de-fogo'),0,()=>1,{twinned:true});assert.equal(twin.effect.formula,'8d10');assert.equal(twin.result.total,16);
});
test('Afinidade e Evocação mantêm bônus uma vez; raio posterior conserva mínimo e dispensa novo bônus',()=>{
  const c=make();c.rules.history.push({classId:'feiticeiro',level:1,answers:{dragon:'Vermelho — fogo'}});
  const first=roll(c,spell('raio-ardente'),2),later=roll(c,spell('raio-ardente'),2,()=>1,{elementalAffinity:false});
  assert.equal(first.result.total,7);assert.equal(first.effect.formula,'2d6+3');assert.equal(later.result.total,4);assert.ok(later.effect.elementalAdept);
  c.abilities.cha.score=8;assert.equal(roll(c,spell('raio-ardente'),2).result.total,3,'bônus negativo não recebe o mínimo');
  c.classes=[{classId:'mago',level:20,subclassId:'evocacao'}];c.abilities.int.score=16;c.rules.history=[{classId:'mago',level:4,answers:{feat:'Adepto Elemental',featElement:'Fogo'}}];
  const evocation=roll(c,spell('bola-de-fogo',{classId:'mago'}),3);assert.equal(evocation.result.total,19);
});
test('magia de dano misto usa mínimo em todos os dados, resistência ignorada só no elemento escolhido',()=>{
  for(const [type,id,circle,expected]of [['Frio','tempestade-de-gelo',4,12],['Fogo','coluna-de-chamas',6,18],['Trovejante','onda-destrutiva',5,20]] as const){
    const {effect,result}=roll(make([type]),spell(id),circle);
    assert.equal(result.total,expected);assert.equal(effect.elementalAdept!.types.length,1);
    const detail=spellDamageBreakdown(result,effect.components!);
    const totals=detail.breakdown.slice(-effect.components!.length).map(x=>Number(x.split(' = ')[1]));
    assert.equal(totals.reduce((a,b)=>a+b,0),expected);
  }
  const legacy=roll(make(['Frio']),spell('tempestade-de-gelo',{dmgType:'concussao'}),4);
  assert.equal(legacy.result.total,12,'parcelas automáticas mantêm compatibilidade com o tipo único antigo');
  assert.equal(roll(make(['Frio']),spell('cone-de-frio',{dmgType:'gelo'}),5).result.total,16);
  const {raw,effect}=roll(make(),spell('bola-de-fogo'),3);
  assert.equal(applyElementalAdept(raw,{...effect.elementalAdept!,types:['fogo','frio']}).total,16,'mais elementos não reaplicam o mesmo mínimo');
});
test('cura, armas/fórmula livre, tipos alheios e adaptações próprias não recebem o mínimo',()=>{
  const c=make();
  for(const s of [spell('curar-ferimentos'),spell('toque-arrepiante'),spell('raio-de-fogo',{customRoll:'3d4+2'}),spell('raio-de-fogo',{customSpell:true}),spell('cone-de-frio',{dmgType:'fogo'})]){
    assert.equal(resolveSpellEffect(c,s,s.circle,E).elementalAdept ?? null,null);
  }
  assert.equal(spellElementalAdept(c,{name:'Arma de fogo',dmgType:'fogo'},E,'1d6'),null);
  const {effect}=roll(c,spell('raio-de-fogo'),0),d20=evaluateDicePool({20:1},0,'adv',{},()=>1);
  assert.equal(applyElementalAdept(d20,effect.elementalAdept!),d20);
  const wrongFormula=evaluateDicePool({6:1},0,'normal',{},()=>1);assert.equal(applyElementalAdept(wrongFormula,effect.elementalAdept!),wrongFormula);
});
test('tipo escolhido/aleatório, efeitos em rodadas e parcelas sem vínculo ficam explícitos na mesa',()=>{
  const c=make(['Ácido','Elétrico','Fogo','Frio','Trovejante']);
  for(const id of ['orbe-cromatica','glifo-de-vigilancia','escudo-de-fogo','rajada-prismatica','muralha-prismatica','tempestade-da-vinganca','fome-de-hadar','destruicao-lancinante','destruicao-trovejante','flecha-relampejante']){
    const s=spell(id),effect=resolveSpellEffect(c,s,s.circle,E);
    assert.equal(effect.elementalAdept,null,id);assert.match(effect.summary,/conferir na mesa/,id);assert.match(effect.elementalAdeptNote!,/não aplica o mínimo automaticamente/);
  }
});
