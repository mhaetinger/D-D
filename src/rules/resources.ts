import { ability, active, level, norm, selections, state, subclass, type Engine, type Sheet } from './model';
import { deathStatus, endRage, requireConscious } from './health';
import { concentration, endConcentration, startConcentration, validateConcentrationStart } from './concentration';
import { relentlessDC } from './survival';
import { hasFeat } from './passives';
import {isDragonborn,racialBreathProfile} from './draconic-ancestry';
import {superioritySources} from './maneuvers';
import {clearEvasiveFootwork} from './evasive-footwork-state';
import {finishLungingAttack,finishFeintingAttack,finishRiposte} from './weapon-attack-session';
import {clearPendingFeint} from './feinting-state';
import {endCommand} from './commanders-strike-state';
import {endReceivedBardic} from './bardic-received';
import {endMonkReturn} from './monk-state';
export interface Resource { id:string; classId:string; name:string; max:number; recovery:'short'|'long'|'none'; kind:'counter'|'pool'|'toggle'|'note'|'portent'; note:string; cost?:[string,number]; action?:string }

/** Cada definição usa nível da própria classe, nunca nível total. Sem ficha-modelo. */
export function resourcesFor(c: Sheet, E: Engine): Resource[] {
  const list: Resource[] = [];
  const add = (classId:string,id:string,name:string,max:number,recovery:Resource['recovery'],note:string,kind:Resource['kind']='counter',extra:Partial<Resource>={}) => list.push({classId,id:classId+':'+id,name,max,recovery,note,kind,...extra});
  const sub = (id:string) => subclass(c,id,E);
  const wisdom = Math.max(1,ability(c,'wis')), charisma = Math.max(1,ability(c,'cha'));
  if(isDragonborn(c)){
    const p=racialBreathProfile(c,E);
    add('race','breath','Arma de Sopro',1,'short',p?`Ação: ${p.dice || 'conferir dano'}; ${p.area}; resistência de ${p.save==='dex'?'DES':'CON'}, CD 8 + CON + proficiência. Cada criatura na área sofre dano integral na falha e metade no sucesso. Recupera em descanso curto ou longo. Não é magia nem substitui um ataque de Ataque Extra.`:'Escolha a ancestralidade racial com a ficha desbloqueada. Um uso por descanso curto ou longo.','counter',{action:'dragonbornBreath'});
  }
  const b = level(c,'barbaro');
  if (b) {
    add('barbaro','rage','Fúria',b===20?Infinity:b>=17?6:b>=12?5:b>=6?4:b>=3?3:2,'long',`Dura até 1 minuto; sem armadura pesada. Dano corpo a corpo com FOR +${b>=16?4:b>=9?3:2}. Não pode conjurar/concentrar. Resistência a concussão, cortante e perfurante.`, 'counter',{action:'rage'});
    if (sub('barbaro')==='berserker' && b>=3) add('barbaro','frenzy','Em Frenesi',1,'none','Durante a Fúria: a partir do próximo turno, um ataque corpo a corpo com ação bônus. Ao terminar esta Fúria, sofre +1 exaustão.','toggle');
    if (sub('barbaro')==='totemico' && b>=3) {
      // Aspecto da Besta (6) e Sintonia Totêmica (14) não trocam o Espírito (3).
      const bear = norm(c.rules?.history?.find((h:Sheet)=>h.classId==='barbaro' && h.level===3)?.answers?.totem)==='urso';
      add('barbaro','totem','Totem da Fúria',0,'none',bear ? 'Urso: durante a Fúria, resistência a todos os danos exceto psíquico.' : 'Consulte o Totem Espiritual escolhido: os benefícios só se aplicam nas condições do livro.','note');
    }
    if (b>=11) {
      const uses=c.ruleState?.used?.['barbaro:relentless'] ?? 0;
      const dc=Number.isSafeInteger(uses) && uses>=0 && uses<=100000?relentlessDC(c):'conferir registro';
      add('barbaro','relentless',`Fúria Implacável · CD ${dc}`,0,'none','Ao cair a 0 PV em Fúria sem morrer instantaneamente, escolha testar CON no dano detalhado. Cada tentativa aumenta a próxima CD em 5; descanso curto/longo volta a CD 10.','note');
    }
  }
  const bard = level(c,'bardo');
  if (bard) {
    add('bardo','inspiration','Inspiração de Bardo',charisma,bard>=5?'short':'long',`Dado d${bard>=15?12:bard>=10?10:bard>=5?8:6}. Ação bônus, outra criatura a até 18 m que possa ouvir. Dura 10 minutos; um dado por criatura.`);
    if (bard>=3 && sub('bardo')==='conhecimento') add('bardo','cutting','Palavras de Interrupção',0,'none','Reação: gaste um uso de Inspiração de Bardo e subtraia o dado do ataque, teste de habilidade ou dano de criatura a até 18 m que possa ouvir.','note');
    if (bard>=3 && sub('bardo')==='bravura') add('bardo','combatInspiration','Inspiração em Combate',0,'none','A criatura pode gastar seu dado de inspiração no dano de arma ou, com reação, na CA contra um ataque. É o mesmo uso de Inspiração.','note');
  }
  const warlock = level(c,'bruxo');
  if (warlock) {
    add('bruxo','pact','Magia de Pacto',c.pactMagic?.total || 0,'short',`Espaços separados, todos do ${c.pactMagic?.level || 1}º nível. Recupera em descanso curto/longo.`,'note');
    for (const [minimum,circle] of [[11,6],[13,7],[15,8],[17,9]]) if (warlock>=minimum) add('bruxo','arcanum'+circle,'Arcanum Místico · '+circle+'º',1,'long','Conjura a magia escolhida desse nível uma vez, sem gastar espaço. Não é um espaço para outras magias.');
    if (warlock>=20) add('bruxo','master','Mestre Místico',1,'long','Suplique por 1 minuto para recuperar todos os espaços de Pacto.', 'counter',{action:'pactRecovery'});
    if (sub('bruxo')==='arquifada') {
      add('bruxo','feyPresence','Presença Feérica',1,'short','Ação: cubo de 3 m a partir de você; SAB contra CD de bruxo, enfeitiçado ou amedrontado até fim do seu próximo turno.');
      if (warlock>=6) add('bruxo','mistyEscape','Névoa de Fuga',1,'short','Reação ao sofrer dano: invisível e teleporte de até 18 m.');
      if (warlock>=14) add('bruxo','darkDelirium','Delírio Sombrio',1,'short','Ação, concentração até 1 minuto; o alvo testa SAB contra CD de bruxo.');
    }
    if (sub('bruxo')==='corruptor') {
      if (warlock>=6) add('bruxo','darkLuck','Sorte do Próprio Obscuro',1,'short','Acrescente 1d10 a um teste de habilidade ou de resistência antes do efeito ser resolvido.');
      if (warlock>=14) add('bruxo','hurl','Lançar no Inferno',1,'long','Ao acertar um ataque, transporte o alvo; 10d10 psíquico ao voltar se não for corruptor.');
    }
    if (sub('bruxo')==='grandeAntigo' && warlock>=6) add('bruxo','entropic','Proteção Entrópica',1,'short','Reação: desvantagem num ataque contra você; se errar, vantagem no próximo ataque contra ele até fim do próximo turno.');
    for (const invocation of selections(c,E,'invocations')) {
      const ref = E.reference(invocation,'bruxo');
      // Cárceri limita a repetição na mesma criatura, não um uso global/dia.
      // O contador legado permanece no documento, sem limitar outros alvos.
      if(norm(invocation)==='correntes de carceri')continue;
      if (ref?.text && /descanso longo/i.test(ref.text)) add('bruxo','invocation-'+norm(invocation).replace(/ /g,'-'),invocation,1,'long',ref.text);
    }
  }
  const cleric = level(c,'clerigo'), paladin = level(c,'paladino');
  if (cleric>=2 || paladin>=3) {
    const max = cleric>=18?3:cleric>=6?2:1;
    add(cleric>=2?'clerigo':'paladino','channel','Canalizar Divindade',max,'short','Reserva compartilhada entre classes. Um uso ativa uma opção de Canalizar Divindade disponível; nunca some os usos de clérigo e paladino.', 'counter',{id:'shared:channel'});
  }
  if (cleric) {
    if (cleric>=10) add('clerigo','intervention','Intervenção Divina',1,'long',`Ação: d100 ≤ ${cleric} (${cleric>=20?'sucesso automático':'nível de clérigo'}). Falha: tenta após descanso longo; sucesso: aguarde 7 dias.`, 'counter',{action:'intervention'});
    if (sub('clerigo')==='luz') add('clerigo','wardingFlare','Labareda Protetora',wisdom,'long','Reação: imponha desvantagem a um ataque de criatura que veja a até 9 m; no nível 6 pode proteger outra criatura.');
    if (sub('clerigo')==='guerra') add('clerigo','warPriest','Sacerdote da Guerra',wisdom,'long','Após a ação Atacar, faça um ataque de arma como ação bônus.');
    if (sub('clerigo')==='tempestade') add('clerigo','wrath','Ira da Tempestade',wisdom,'long','Reação ao ser atingido por criatura a até 1,5 m: 2d8 elétrico ou trovejante, DES para metade.');
    if (sub('clerigo')==='enganacao') {
      add('clerigo','blessing','Bênção do Trapaceiro',1,'none','Ação: toque outra criatura; vantagem em Furtividade por 1 hora ou até escolher outra.','toggle');
      if (cleric>=2) add('clerigo','duplicate','Invocar Duplicidade',1,'none','Gasta Canalizar Divindade; concentração até 1 minuto.','toggle',{cost:['shared:channel',1]});
    }
  }
  if (paladin) {
    add('paladino','layHands','Cura pelas Mãos',paladin*5,'long','Ação: cure PV ou gaste 5 pontos por doença/veneno. Não afeta mortos-vivos ou constructos.','pool');
    add('paladino','sense','Sentido Divino',Math.max(0,1+ability(c,'cha')),'long','Ação: detecta celestial, corruptor e morto-vivo a até 18 m sem cobertura total, até fim do próximo turno.');
    if (paladin>=14) add('paladino','cleansing','Toque Purificador',charisma,'long','Ação: termine uma magia em você ou criatura voluntária tocada.');
    if (paladin>=3 && sub('paladino')==='devocao') add('paladino','sacredWeapon','Arma Sagrada',1,'none',`Ação: gasta Canalizar Divindade; uma arma por 1 minuto, ataque +${charisma} CAR (mín. 1), luz e dano mágico.`,'toggle',{cost:['shared:channel',1]});
    if (paladin>=3 && sub('paladino')==='vinganca') add('paladino','enmity','Voto de Inimizade',1,'none','Ação bônus: Canalizar Divindade, vantagem contra UM alvo a até 3 m, por 1 minuto.','toggle',{cost:['shared:channel',1]});
    if (paladin>=6) add('paladino','protection','Aura de Proteção',0,'none',`Consciente: você e aliados a até ${paladin>=18?9:3} m somam +${charisma} CAR (mín. 1) em resistências. Não é proficiência.`,'note');
    if (paladin>=10) add('paladino','courage','Aura de Coragem',0,'none',`Consciente: você e aliados a até ${paladin>=18?9:3} m não podem ficar amedrontados.`,'note');
    if (paladin>=20) add('paladino','oathCapstone',E.data.classes.paladino.subclasses[sub('paladino')]?.features?.[20]?.[0] || 'Poder do Juramento',1,'long','Ative a transformação do juramento conforme sua descrição, duração e ação.');
  }
  const druid = level(c,'druida');
  if (druid>=2) {
    const moon = sub('druida')==='lua', cr = moon ? druid>=6?Math.floor(druid/3):1 : druid>=8?1:druid>=4?.5:.25;
    add('druida','wildShape','Forma Selvagem',druid>=20?Infinity:2,'short',`ND máx. ${cr}; duração ${Math.floor(druid/2)} h; ${druid<4?'sem natação/voo':druid<8?'sem voo':'voo permitido'}. ${moon?'Ação bônus; a partir do nível 10, elemental custa 2 usos.':'Ação.'} PV da besta são uma reserva própria.`,'counter',{action:'wildShape'});
    if (moon) add('druida','combatHealing','Cura em Forma Selvagem',Infinity,'none','Ação bônus: gaste espaço para curar 1d8 por nível do espaço na forma.','counter',{action:'moonHeal'});
    if (sub('druida')==='terra') add('druida','naturalRecovery','Recuperação Natural',1,'long',`No descanso curto, recupere espaços somando até ${Math.ceil(druid/2)} níveis, nenhum de nível 6 ou maior. Uma vez por dia.`,'counter',{action:'slotRecovery'});
  }
  const fighter = level(c,'guerreiro');
  if (fighter) {
    add('guerreiro','secondWind','Retomar o Fôlego',1,'short',`Ação bônus: cure 1d10 + ${fighter} PV.`, 'counter',{action:'secondWind'});
    if (fighter>=2) add('guerreiro','actionSurge','Surto de Ação',fighter>=17?2:1,'short','Uma ação adicional no seu turno. No nível 17, duas utilizações, no máximo uma por turno.');
    if (fighter>=9) add('guerreiro','indomitable','Indomável',fighter>=17?3:fighter>=13?2:1,'long','Refaça uma resistência que falhou; deve usar o novo resultado.');
  }
  const sorcerer = level(c,'feiticeiro');
  if (sorcerer>=2) add('feiticeiro','sorcery','Pontos de Feitiçaria',sorcerer,'long','Conversão: espaços 1–5 custam 2/3/5/6/7 pontos. Metamagias consomem a mesma reserva; não ultrapasse o máximo.','note');
  if (sorcerer && sub('feiticeiro')==='selvagem') {
    add('feiticeiro','tides','Marés de Caos',1,'long','Vantagem em ataque, teste de habilidade ou resistência. O Mestre pode recarregar após Surto de Magia Selvagem.');
    if (sorcerer>=6) add('feiticeiro','bendLuck','Dobrar a Sorte',Infinity,'none','Reação: 2 pontos de feitiçaria para somar/subtrair 1d4 numa jogada de outra criatura.','counter',{cost:['feiticeiro:sorceryPool',2]});
  }
  const monk = level(c,'monge');
  if (monk>=2) {
    add('monge','ki','Pontos de Chi',monk,'short','Medite pelo menos 30 minutos no descanso. Rajada de Golpes, Defesa Paciente e Passo do Vento custam 1 ponto.','pool');
    if (monk>=18) add('monge','emptyBody','Corpo Vazio',1,'none','Ação: 4 Chi para ficar invisível e resistir a todos os danos exceto energia por 1 minuto.','toggle',{cost:['monge:ki',4]});
    if (sub('monge')==='maoAberta' && monk>=6) add('monge','wholeness','Integridade Corporal',1,'long',`Ação: cure ${3*monk} PV.`,'counter',{action:'wholeness'});
    if (sub('monge')==='sombras' && monk>=3) add('monge','shadowArts','Artes Sombrias',0,'none','2 Chi: Escuridão, Visão no Escuro, Passos sem Pegadas ou Silêncio (sem componentes materiais).','note');
    if (sub('monge')==='quatroElementos' && monk>=3) add('monge','disciplines','Disciplinas Elementais',0,'none',selections(c,E,'disciplines').join(', ') || 'Consulte as disciplinas escolhidas e seus custos de Chi.','note');
  }
  const rogue = level(c,'ladino');
  if (rogue) {
    add('ladino','sneak','Ataque Furtivo',0,'none',`${Math.ceil(rogue/2)}d6, uma vez por turno, com acuidade ou arma à distância. Exige vantagem ou aliado elegível e ausência de desvantagem.`,'note');
    if (rogue>=20) add('ladino','luck','Golpe de Sorte',1,'short','Transforme erro em acerto contra alvo ao alcance, ou trate teste de habilidade como 20 natural.');
    if (sub('ladino')==='trapaceiroArcano' && rogue>=17) add('ladino','spellThief','Ladrão de Magia',1,'long','Reação quando magia é lançada contra você; o conjurador testa a habilidade de conjuração contra sua CD.');
  }
  const ranger = level(c,'patrulheiro');
  if (ranger && sub('patrulheiro')==='besta' && ranger>=3) add('patrulheiro','companion','Companheiro Animal',0,'none','Adaptação: Patrulheiro Revisado do livro local. Registre nome, PV e comandos do companheiro sem descontar PV do patrulheiro.','note');
  const wizard = level(c,'mago');
  if (wizard) {
    add('mago','arcaneRecovery','Recuperação Arcana',1,'long',`Uma vez por dia, no descanso curto: espaços somando até ${Math.ceil(wizard/2)} níveis, no máximo de 5º nível.`,'counter',{action:'slotRecovery'});
    if (wizard>=2 && sub('mago')==='abjuracao') add('mago','ward','Proteção Arcana',Math.max(0,2*wizard+ability(c,'int')),'none','Primeira abjuração de nível 1+ após descanso longo cria a proteção; abjurações seguintes recuperam 2 × nível. Absorve dano antes dos PV temporários.','pool');
    if (wizard>=2 && sub('mago')==='adivinhacao') add('mago','portent','Presságio / Prodígio',wizard>=14?3:2,'long','Role ao terminar descanso longo. Substitua uma jogada vista ANTES de rolar, no máximo uma vez por rodada.','portent');
    if (wizard>=6 && sub('mago')==='conjuracao') add('mago','benign','Transposição Benigna',1,'long','Teleporte até 9 m ou troque de lugar com criatura voluntária. Recarrega também ao conjurar magia de conjuração de nível 1+.');
    if (wizard>=2 && sub('mago')==='encantamento') add('mago','hypnotic','Olhar Hipnotizante',1,'none','Ação, alvo a 1,5 m. Falha/encerramento impede usar de novo nesse alvo até descanso longo. Registre o alvo.','toggle');
    if (wizard>=10 && sub('mago')==='adivinhacao') add('mago','thirdEye','O Terceiro Olho',1,'long','Ação: visão no escuro, etérea, ler idiomas ou ver invisível conforme a regra; até incapacitar ou descansar.');
    if (wizard>=10 && sub('mago')==='ilusao') add('mago','illusorySelf','Passo Ilusório',1,'short','Reação: interponha duplicata ilusória e faça o ataque contra você errar.');
    if (wizard>=6 && sub('mago')==='transmutacao') add('mago','stone','Pedra do Transmutador',1,'none','8 horas de trabalho: escolha visão no escuro, +3 m deslocamento, proficiência em CON ou resistência a ácido/frio/fogo/elétrico/trovejante.','toggle');
    if (wizard>=14 && sub('mago')==='evocacao') add('mago','overchannel','Sobrecarga',0,'none','Primeiro uso após descanso longo sem custo; novos usos causam 2d12 necrótico por nível da magia, aumentando 1d12 por uso adicional.','note');
  }
  // Opções de Canalizar compartilham a reserva; efeitos não ganham usos extras.
  if (cleric>=2) {
    add('clerigo','turn','Expulsar Mortos-Vivos',1,'none','Ação: Canalizar Divindade. Mortos-vivos a até 9 m testam SAB; confira Destruir Mortos-Vivos pelo nível.','toggle',{cost:['shared:channel',1]});
    const channels:Record<string,[string,string,number][]> = {
      conhecimento:[['eras','Conhecimento das Eras',2],['thoughts','Ler Pensamentos',6]], vida:[['preserve','Preservar a Vida',2]], luz:[['dawn','Radiação do Amanhecer',2]],
      tempestade:[['destructive','Ira Destruidora',2]], natureza:[['charm','Enfeitiçar Animais e Plantas',2]], guerra:[['guided','Ataque Dirigido',2],['warBlessing','Bênção do Deus da Guerra',6]], enganacao:[['cloak','Manto de Sombras',6]],
    };
    for (const [id,name,min] of channels[sub('clerigo')] || []) if (cleric>=min) add('clerigo',id,name,1,'none',E.reference(name,'clerigo',sub('clerigo'))?.text || 'Use esta opção conforme sua descrição no livro.','toggle',{cost:['shared:channel',1]});
    if (cleric>=17 && sub('clerigo')==='conhecimento') add('clerigo','visions','Visões do Passado',1,'short','Medite pelo menos 1 minuto; duração de até seu modificador de SAB em minutos, mantendo concentração.');
    if (cleric>=17 && sub('clerigo')==='luz') add('clerigo','corona','Coroa de Luz',1,'none','Ação: aura de luz por 1 minuto; desvantagem dos inimigos contra suas magias de fogo/radiante nas condições do livro.','toggle');
  }
  if (paladin>=3) {
    const options:Record<string,[string,string][]> = {devocao:[['turn','Expulsar o Profano']],ancioes:[['wrath','Ira da Natureza'],['turn','Expulsar os Infiéis']],vinganca:[['abjure','Abjurar Inimigo']]};
    for (const [id,name] of options[sub('paladino')] || []) add('paladino',id,name,1,'none',E.reference(name,'paladino',sub('paladino'))?.text || 'Ação: escolha um alvo e resolva as condições do juramento.','toggle',{cost:['shared:channel',1]});
    if (paladin>=15 && sub('paladino')==='ancioes') add('paladino','undying','Sentinela Imortal',1,'long','Quando cair a 0 PV sem morrer, pode ficar com 1 PV.');
  }
  if (sorcerer>=6 && sub('feiticeiro')==='draconica') add('feiticeiro','elementalAffinity','Afinidade Elemental · resistência',1,'none','Gaste 1 ponto de feitiçaria para resistência ao elemento de sua ancestralidade por 1 hora. O bônus de CAR não tem custo: entra em uma rolagem inicial de dano da magia com tipo fixo reconhecido. Outros raios não repetem o bônus; tipos variáveis, dano posterior e fórmulas próprias são resolvidos na mesa.','toggle',{cost:['feiticeiro:sorceryPool',1]});
  if (sorcerer>=14 && sub('feiticeiro')==='draconica') add('feiticeiro','wings','Asas de Dragão',1,'none','Ação bônus para manifestar/recolher; armaduras precisam acomodar as asas.','toggle');
  if (sorcerer>=18 && sub('feiticeiro')==='draconica') add('feiticeiro','presence','Presença Dracônica',1,'none','Ação: 5 pontos para aura de respeito/medo, concentração até 1 minuto.','toggle',{cost:['feiticeiro:sorceryPool',5]});
  const metaCosts:Record<string,number> = {'Magia Acelerada':2,'Magia Aumentada':3,'Magia Cuidadosa':1,'Magia Distante':1,'Magia Estendida':1,'Magia Potencializada':1,'Magia Sutil':1};
  for (const name of selections(c,E,'metamagic')) if (sorcerer>=3 && metaCosts[name]) add('feiticeiro','meta-'+norm(name).replace(/ /g,'-'),name,Infinity,'none',`${metaCosts[name]} ponto(s). ${E.reference('Metamágica','feiticeiro')?.text || 'Use ao conjurar, obedecendo às condições desta opção. Apenas uma opção por magia, salvo exceção explícita.'}`,'counter',{cost:['feiticeiro:sorceryPool',metaCosts[name]]});
  if (monk>=3 && sub('monge')==='sombras') for (const name of ['Escuridão','Visão no Escuro','Passos sem Pegadas','Silêncio']) add('monge','shadow-'+norm(name).replace(/ /g,'-'),name,Infinity,'none','Artes Sombrias: ação e 2 Chi; respeite duração/concentração da magia.','counter',{cost:['monge:ki',2]});
  if (monk>=2) for (const [id,name,note] of [['flurry','Rajada de Golpes','Após a ação Atacar, dois ataques desarmados como ação bônus.'],['patient','Defesa Paciente','Ação bônus: Esquivar.'],['step','Passo do Vento','Ação bônus: Desengajar ou Disparada; distância de salto dobrada no turno.']]) add('monge',id,name,Infinity,'none',note,'counter',{cost:['monge:ki',1]});
  if (monk>=5) add('monge','stunning','Ataque Atordoante',Infinity,'none','Após acertar ataque corpo a corpo com arma; o alvo testa CON, atordoado até o fim do seu próximo turno se falhar.','counter',{cost:['monge:ki',1]});
  if (monk>=18) add('monge','astral','Projeção Astral',Infinity,'none','Ação: 8 Chi, conjura Projeção Astral sem componentes materiais, somente em você.','counter',{cost:['monge:ki',8]});
  if (monk>=3 && sub('monge')==='quatroElementos') {
    const context = E.context({}, {}, c,'monge'); context.level = monk;
    for (const name of selections(c,E,'disciplines')) {
      const reference = E.optionReference(context,{id:'disciplines',options:E.options.disciplines.map((x:Sheet)=>({value:x.name,label:x.name}))},{value:name,label:name});
      const text = reference?.text || '', cost = Number(text.match(/gastar\s+(\d+)\s+pontos?\s+de\s+chi/i)?.[1]);
      if (cost>0) add('monge','discipline-'+norm(name).replace(/ /g,'-'),name,Infinity,'none',text+' Custos adicionais devem ser descontados da reserva de Chi.','counter',{cost:['monge:ki',cost]});
    }
  }
  if (monk>=17 && sub('monge')==='maoAberta') add('monge','quivering','Palma Vibrante',Infinity,'none',`3 Chi após acertar ataque desarmado; pode manter por ${monk} dias. Uma ação encerra: CON contra sua CD, falha reduz a 0 PV; sucesso sofre 10d10 necrótico.`,'counter',{cost:['monge:ki',3]});
  if (wizard>=6 && sub('mago')==='encantamento') add('mago','instinctive','Encanto Instintivo',1,'none','Reação: escolha atacante e outra criatura ao alcance; após sucesso dele, não pode usar nesse atacante até descanso longo.','toggle');
  if (wizard>=10 && sub('mago')==='transmutacao') add('mago','shapechanger','Metamorfo',1,'short','Conjure Metamorfose em si mesmo sem espaço, virando besta ND 1 ou menor.');
  if (wizard>=14 && sub('mago')==='transmutacao') add('mago','masterTransmuter','Mestre Transmutador',1,'none','Consuma a pedra e escolha a transformação; exige ação e tocar o alvo. Recriar a pedra exige 8 horas.','toggle');
  for(const source of superioritySources(c,E))add(source.classId,'superiority',source.classId==='feat'?'Adepto Marcial':'Dados de Superioridade',source.max,'short',`d${source.die} · ${source.name}. Recupera em descanso curto ou longo. Auto Ficha: Precisão no resultado do ataque; manobras de dano conhecidas em Adicionais da arma. Trespassante registra separadamente apenas um dado em outra criatura ao alcance; a mesma jogada precisa atingir a segunda CA. Não dobra em crítico nem soma bônus; a tentativa gasta mesmo se não atingir a segunda criatura. Estendido é marcado na arma antes do ataque e gasta ao confirmar Atq, mesmo se errar; Dano inclui o dado já pago no acerto. Golpe do Comandante junto desta reserva cede um ataque da ação Atacar no próprio turno, usa ação bônus e paga um dado antes da reação imediata do aliado. Registre só o dado adicional do ataque dele; não use os bônus desta ficha nem gaste novamente. Contra-Atacar junto da arma usa reação após uma criatura errar uma jogada corpo a corpo contra você; paga antes de atacar, mesmo se errar, e Dano inclui o dado já pago no acerto. Fintar usa ação bônus e um dado para vantagem no próximo ataque contra o alvo escolhido neste turno; marque Finta na arma ou use Resolver na mesa, sem outro gasto. Aparar em Dano detalhado → Calcular por tipo gasta ao Aplicar dano. Inspirar junto desta reserva usa face + CAR para informar PV temporários a um aliado. Passo Evasivo soma a face à CA até parar de se mover; encerre junto da CA. Esses controles incluem o dado e descontam esta origem ao confirmar. Não gaste de novo em Usar na mesa: esse botão registra outras manobras já resolvidas; apenas uma manobra por ataque.`);
  if(hasFeat(c,E,'Sortudo'))add('feat','lucky','Sortudo',3,'long','3 pontos por descanso longo. Gaste 1 antes de resolver um ataque, teste de habilidade ou resistência: role um d20 adicional e escolha a face, mesmo com vantagem/desvantagem. Pode afetar um ataque contra você; pontos de criaturas diferentes se cancelam, sem dado adicional. O Sortudo racial não gasta esta reserva.','counter',{action:'lucky'});
  for(const r of list){const value=c.rules?.resourceMaxOverrides?.[r.id];if(Number.isInteger(value)&&value>=0&&value<=100&&!r.cost)r.max=value;}
  return list;
}

const arcanumId = (spell:Sheet) => spell.classId==='bruxo' && /arcanum|arcana mistica|arcano mistico/.test(norm(spell.extraSource)) ? 'bruxo:arcanum'+spell.circle : '';
const arcanumSpells = (c:Sheet,id:string) => (c.spells || []).filter((spell:Sheet)=>arcanumId(spell)===id);

export function used(c: Sheet, r: Resource) {
  if (r.id==='feiticeiro:tides' && c.tidesOfChaosAvailable === false) return 1;
  return Math.max(0,Math.min(r.max,Math.max(Number(c.ruleState?.used?.[r.id] || 0),...arcanumSpells(c,r.id).map((spell:Sheet)=>Number(spell.usesUsed || 0)))));
}
export function remaining(c: Sheet, r: Resource) {
  if(r.id==='clerigo:intervention' && c.ruleState?.interventionPending)return 0;
  if (Number(c.ruleState?.blockedUntil?.[r.id] || 0)>Date.now()) return 0;
  if (r.id==='feiticeiro:sorceryPool') return Math.max(0,Math.min(r.max,c.sorceryPoints.current));
  if (r.kind==='pool') return Math.max(0,Math.min(r.max,Number(c.ruleState?.pools?.[r.id] ?? (r.id==='mago:ward'?0:r.max))));
  return r.max-used(c,r);
}
export function spend(c: Sheet, r: Resource, amount=1) {
  validateSuperiorityRecord(c,r);
  if (!Number.isInteger(amount) || amount<1 || amount>remaining(c,r)) throw new Error('Recursos insuficientes; nenhuma alteração aplicada.');
  const s = state(c);
  if (r.id==='feiticeiro:sorceryPool') { c.sorceryPoints.current -= amount; return; }
  if (r.kind==='pool') s.pools[r.id] = remaining(c,r)-amount;
  else s.used[r.id] = used(c,r)+amount;
  for (const spell of arcanumSpells(c,r.id)) spell.usesUsed = s.used[r.id];
  if (r.id==='feiticeiro:tides') c.tidesOfChaosAvailable = false;
}
/** Corrigir um clique deve devolver o mesmo uso na magia e no painel. */
export function refund(c:Sheet,r:Resource) {
  validateSuperiorityRecord(c,r);
  const recorded=c.ruleState?.used?.[r.id];
  if(r.id==='race:breath' && recorded!==undefined && (!Number.isSafeInteger(recorded) || recorded<0))throw new Error('Registro de uso do sopro ilegível preservado. Confira o registro antes de corrigi-lo.');
  if(r.id==='feat:lucky' && recorded!==undefined && (!Number.isInteger(recorded) || recorded<0))throw new Error('Reserva de Sortudo ilegível preservada. Confira o registro antes de corrigi-lo.');
  const value = Math.max(0,(r.id==='feat:lucky'?recorded ?? 0:used(c,r))-1);
  state(c).used[r.id] = value;
  for (const spell of arcanumSpells(c,r.id)) spell.usesUsed = value;
  if (r.id==='feiticeiro:tides') c.tidesOfChaosAvailable = true;
}
function validateSuperiorityRecord(c:Sheet,r:Resource) {
  if(!['guerreiro:superiority','feat:superiority'].includes(r.id))return;
  const recorded=c.ruleState?.used?.[r.id];
  if(recorded!==undefined && (!Number.isSafeInteger(recorded) || recorded<0))throw new Error('Registro de superioridade ilegível preservado. Confira os usos antes de continuar.');
}
export function toggleResource(c: Sheet, r: Resource, E: Engine) {
  const enabled = active(c,r.id);
  if(!enabled) requireConscious(c);
  const held=['clerigo:duplicate','feiticeiro:presence'].includes(r.id);
  if(held && !enabled)validateConcentrationStart(c,{name:r.name});
  const s = state(c);
  if(r.id==='barbaro:rage' && enabled) {endRage(c);return;}
  if (r.id==='mago:masterTransmuter' && !enabled) {
    if (!active(c,'mago:stone')) throw new Error('Crie a Pedra do Transmutador antes de consumi-la.');
    s.active['mago:stone'] = false;
  }
  if (r.id==='mago:stone' && !s.targets[r.id]) s.targets[r.id] = 'darkvision';
  if (r.id==='mago:hypnotic') {
    const target = String(s.targets[r.id] || '').trim();
    if (!enabled && (!target || s.targetsUsed?.[r.id]?.includes(target))) throw new Error('Escolha outro alvo; este não pode ser afetado novamente antes do descanso longo.');
    if (enabled) { s.targetsUsed ||= {}; s.targetsUsed[r.id] ||= []; s.targetsUsed[r.id].push(target); }
  }
  if (!enabled && r.cost) {
    const source = r.cost[0]==='feiticeiro:sorceryPool' ? {id:r.cost[0],max:c.sorceryPoints.max,kind:'pool'} as Resource : resourcesFor(c,E).find(x=>x.id===r.cost![0]);
    if (!source) throw new Error('A reserva exigida não pertence a este personagem.');
    spend(c,source,r.cost[1]);
  }
  if (r.id==='barbaro:frenzy' && !active(c,'barbaro:rage')) throw new Error('Ative a Fúria antes do Frenesi.');
  if (r.id==='barbaro:frenzy' && !enabled) s.frenzyUsed = true;
  if (r.id==='barbaro:rage' && !enabled) {spend(c,r);endConcentration(c);}
  if(held){
    if(!enabled)startConcentration(c,{name:r.name,duration:'Até 1 minuto',resourceId:r.id});
    else if(concentration(c)?.resourceId===r.id)endConcentration(c);
  }
  s.active[r.id] = !enabled;
}
export function onSpellCast(c: Sheet, spell: Sheet, circle: number, E: Engine) {
  const s = state(c), school = norm(E.spell(spell.bookId || spell.name)?.school || spell.school);
  if (circle>=1 && school==='abjuracao' && subclass(c,'mago',E)==='abjuracao' && level(c,'mago')>=2) {
    const max = Math.max(0,2*level(c,'mago')+ability(c,'int'));
    s.pools['mago:ward'] = s.wardCreated ? Math.min(max,(s.pools['mago:ward'] || 0)+2*circle) : max; s.wardCreated = true;
  }
  if (circle>=1 && school==='conjuracao') s.used['mago:benign'] = 0;
  const arcanum = arcanumId(spell);
  if (arcanum) {
    s.used[arcanum] = 1;
    for (const entry of arcanumSpells(c,arcanum)) entry.usesUsed = 1;
  }
}
export function resetResources(c: Sheet, kind:'short'|'long', E: Engine, random= Math.random, portent?:number[]) {
  const count=resourcesFor(c,E).find(r=>r.kind==='portent')?.max;
  if(kind==='long' && portent && (!count || portent.length!==count || portent.some(n=>!Number.isInteger(n) || n<1 || n>20)))throw new Error('Confira todas as faces de Presságio antes do descanso.');
  const s = state(c);
  // Terminar uma Fúria com Frenesi causa exaustão antes da recuperação do descanso.
  clearEvasiveFootwork(c);
  finishLungingAttack(c);
  finishFeintingAttack(c);clearPendingFeint(c);
  finishRiposte(c);
  endCommand(c);
  endReceivedBardic(c);
  endMonkReturn(c);
  if (active(c,'barbaro:rage')) toggleResource(c,resourcesFor(c,E).find(r=>r.id==='barbaro:rage')!,E);
  if(deathStatus(c).dead)return;
  s.used['barbaro:relentless']=0;
  if(kind==='long')s.used['race:endurance']=0;
  for (const r of resourcesFor(c,E)) if (r.recovery===kind || kind==='long' && r.recovery==='short') {
    s.used[r.id] = 0;
    if (r.kind==='pool') s.pools[r.id] = r.max;
    if (r.kind==='portent') s.portent = (portent || Array.from({length:r.max},()=>1+Math.floor(random()*20))).map(value=>({value,spent:false}));
  }
  // Um descanso curto não encerra automaticamente uma transformação de várias horas.
  for (const key of Object.keys(s.active)) if (!['mago:stone','feiticeiro:wings'].includes(key) && !(kind==='short' && ['druida:wildShape','feat:dualWielder'].includes(key))) s.active[key] = false;
  const held=concentration(c);if(held?.resourceId && !s.active[held.resourceId])endConcentration(c);
  for (const key of Object.keys(s.used)) if (key.startsWith('mago:signature:')) s.used[key]=0;
  if (kind==='long') { s.wardCreated = false; s.pools['mago:ward'] = 0; s.targets = s.active['mago:stone']?{'mago:stone':s.targets['mago:stone']}:{}; s.targetsUsed = {}; c.tidesOfChaosAvailable = true; }
  if (kind==='short' && level(c,'feiticeiro')>=20) c.sorceryPoints.current = Math.min(c.sorceryPoints.max,c.sorceryPoints.current+4);
}
/** Atalhos compartilham as reservas, sem criar um contador paralelo. */
export function useResource(c:Sheet,r:Resource,E:Engine) {
  requireConscious(c);
  if (!r.cost) { spend(c,r); return; }
  const source = r.cost[0]==='feiticeiro:sorceryPool' ? {id:r.cost[0],max:c.sorceryPoints.max,kind:'pool'} as Resource : resourcesFor(c,E).find(x=>x.id===r.cost![0]);
  if (!source) throw new Error('A reserva exigida não pertence ao personagem.');
  spend(c,source,r.cost[1]);
}
