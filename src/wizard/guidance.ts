const escape = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const root = globalThis as any;
const normal = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const ALIGNMENTS: Record<string, string> = {
  'Leal e Bom': 'Procura agir com justiça, cumprir compromissos e ajudar as pessoas.',
  'Neutro e Bom': 'Prioriza ajudar as pessoas, sem depender de regras ou rebeldia.',
  'Caótico e Bom': 'Segue a consciência para fazer o bem, mesmo contrariando autoridades.',
  'Leal e Neutro': 'Valoriza leis, tradições ou um código pessoal consistente.',
  'Neutro': 'Busca equilíbrio ou decide conforme a situação, sem se prender aos extremos.',
  'Caótico e Neutro': 'Valoriza a própria liberdade e evita imposições.',
  'Leal e Mau': 'Usa hierarquias, regras ou compromissos para alcançar interesses cruéis.',
  'Neutro e Mau': 'Busca vantagem própria com pouca consideração pelos outros.',
  'Caótico e Mau': 'Age por crueldade e impulsos destrutivos, desprezando limites.',
};
export function alignmentMarkup(value = '', custom = false) {
  const chosen = custom || value && !(value in ALIGNMENTS) ? 'custom' : value;
  return `<label class="cw-label">Tendência<select data-alignment><option value="">Escolher depois</option>${Object.keys(ALIGNMENTS).map(n => `<option ${chosen === n ? 'selected' : ''}>${n}</option>`).join('')}<option value="custom" ${chosen === 'custom' ? 'selected' : ''}>Escrever minha tendência</option></select></label>${chosen === 'custom' ? `<label class="cw-label">Sua tendência<input data-text="alignment" maxlength="120" value="${escape(value)}" placeholder="Como seu personagem decide agir?"></label>` : ''}<p class="cw-muted">${escape(ALIGNMENTS[value] || 'Uma orientação de interpretação, não uma obrigação de agir sempre igual. Combine com o grupo o que funciona na aventura.')} Livro do Jogador · p. 123.</p>`;
}
const skills: Record<string, string> = {
  acrobacia: 'Manter o equilíbrio, executar acrobacias e evitar quedas em situações delicadas (Destreza).',
  arcanismo: 'Recordar conhecimentos sobre magia, símbolos mágicos e planos de existência (Inteligência).',
  atletismo: 'Escalar, nadar, saltar e superar desafios de força física (Força).',
  atuacao: 'Entreter uma plateia com música, dança, atuação ou narrativa (Carisma).',
  enganacao: 'Esconder a verdade e convencer alguém de uma mentira (Carisma).',
  furtividade: 'Mover-se sem ser percebido e esconder-se (Destreza).',
  historia: 'Recordar acontecimentos, povos, guerras e tradições históricas (Inteligência).',
  intimidacao: 'Influenciar alguém por ameaças ou demonstrações de poder (Carisma).',
  intuicao: 'Perceber intenções, emoções e sinais de mentira (Sabedoria).',
  investigacao: 'Examinar pistas e deduzir conclusões, como o funcionamento de uma passagem secreta (Inteligência).',
  lidar_animais: 'Acalmar animais e compreender seu comportamento (Sabedoria).',
  medicina: 'Identificar doenças ou estabilizar alguém que está morrendo (Sabedoria).',
  natureza: 'Recordar informações sobre plantas, animais, clima e terrenos (Inteligência).',
  percepcao: 'Notar presenças, sons, detalhes escondidos e perigos (Sabedoria).',
  persuasao: 'Influenciar com tato, boa-fé, argumentos ou negociação (Carisma).',
  prestidigitacao: 'Executar movimentos discretos com as mãos, como esconder um objeto (Destreza).',
  religiao: 'Recordar conhecimentos sobre divindades, ritos e símbolos religiosos (Inteligência).',
  sobrevivencia: 'Seguir rastros, orientar-se e encontrar recursos na natureza (Sabedoria).',
};
const languageUsers: Record<string, string> = { Abissal:'demônios', Anão:'anões', Celestial:'celestiais', Comum:'muitos povos das terras civilizadas', 'Dialeto Subterrâneo':'criaturas subterrâneas; confira a nomenclatura usada na mesa', Dracônico:'dragões e povos dracônicos', Élfico:'elfos', Gigante:'gigantes e ogros', Gnômico:'gnomos', Goblin:'goblinoides', Halfling:'halflings', Infernal:'diabos', Orc:'orcs', Primordial:'elementais', Silvestre:'criaturas feéricas', Subcomum:'comerciantes e povos do Subterrâneo' };
const toolUses: Record<string, string> = { 'Ferramentas de ladrão':'abrir fechaduras e desarmar armadilhas', 'Ferramentas de navegador':'traçar rotas e orientar viagens no mar', 'Kit de disfarce':'alterar a aparência com roupas, maquiagem e adereços', 'Kit de falsificação':'imitar documentos e caligrafia', 'Kit de herbalismo':'identificar e preparar ervas; é necessário para criar antitoxinas e poções de cura', 'Kit de venenos':'preparar e aplicar venenos', 'Veículos terrestres':'conduzir carroças, carruagens e outros veículos terrestres', 'Veículos aquáticos':'operar barcos e outras embarcações' };
export function optionReference(d: any, field: any, option: any) {
  const E = root.CharacterEngine, label = option.label, value = option.value;
  const make = (text: string, page: number) => ({name:label, text, page, pdfPage:page});
  if (field.id === 'backgroundVariant') {
    const bg = E.options.backgrounds[d.setup.backgroundId];
    if (value === 'Padrão') return make(`Mantém o antecedente ${bg.name}: ${bg.feature}. Perícias: ${bg.skills.map((s: string) => E.data.skills[s]).join(', ')}. Usa as escolhas de ferramentas, idiomas e equipamento da versão original, sem a variação.`, bg.page);
    const ref = E.reference(label) || root.PHB_REFERENCES.find((r: any) => normal(r.name).startsWith('variacao de ') && normal(r.name).endsWith(': ' + normal(label)));
    return ref ? { ...ref, text:ref.text + '\nAs trocas de característica, ferramentas ou equipamento desta variação precisam ser conferidas e ajustadas na ficha.' } : make(`Variação de ${bg.name}. Consulte a descrição no livro e combine os detalhes com o Mestre.`, bg.page);
  }
  if (skills[value]) return make(`${skills[value]} Proficiência acrescenta seu bônus de proficiência ao teste quando essa perícia se aplica. O Mestre determina quando rolar.`, 174);
  if (E.data.languages.includes(value)) return make(`${label} é usado por ${languageUsers[value] || 'povos do cenário'}. Conhecer o idioma permite falar, ler e escrever. Confirme com o Mestre a disponibilidade de idiomas exóticos na campanha.`, 123);
  if (E.data.tools.includes(value)) return make(`Proficiência permite somar seu bônus em testes que usam ${label.toLowerCase()} para ${toolUses[value] || (label.startsWith('Jogo:') ? 'disputar partidas desse jogo' : label.startsWith('Instrumento:') ? 'tocar esse instrumento musical' : 'trabalhar nesse ofício e criar ou reparar seus produtos')}. A habilidade do teste depende da tarefa. Possuir proficiência não substitui ter a ferramenta.`, 154);
  const ref = E.optionReference(d, field, option);
  if (ref?.text) return ref;
  if (E.data.abilities[value]) return make(`Aumenta ${E.data.abilities[value]} conforme esta escolha. Cada aumento de 2 no valor geralmente melhora o modificador em +1; aumentos da mesma habilidade não podem superar o limite indicado pela regra (normalmente 20).`, 173);
  if (/^Pacote de /i.test(value)) {
    const packs = E.reference('Pacotes de equipamento');
    const paragraphs = packs?.text.split(/\n\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/).map((p: string) => p.replace(/\s+/g, ' ').trim());
    const paragraph = paragraphs?.find((p: string) => normal(p).startsWith(normal(value) + ' ('));
    if (paragraph) return { ...packs, name:label, text:paragraph };
  }
  // Equipamento é consultado por nome nas tabelas já verificadas do motor.
  const weapon = E.progression.weapons.find((w: any) => w.name === value);
  if (weapon) return make(`${label}: dano ${weapon.damage}; ${weapon.kind?.startsWith('simple') ? 'arma simples' : 'arma marcial'}. ${weapon.properties || ''} Confira alcance e propriedades na tabela; sua classe determina a proficiência.`, weapon.pdfPage);
  const armor = E.armorInfo(value);
  if (armor?.type === 'shield') return make(`${label}: soma +2 à Classe de Armadura (CA) enquanto é usado, ocupando uma mão. Apenas um escudo pode beneficiar você por vez. É preciso ter proficiência para usar sem penalidades.`, 145);
  if (armor) return make(`${label}: Classe de Armadura (CA) ${armor.base}${armor.dexCap === 0 ? ', sem bônus de Destreza' : armor.dexCap === 2 ? ' + Destreza (no máximo +2)' : ' + Destreza'}. Categoria: ${armor.type}.${armor.strength ? ` Exige Força ${armor.strength} para evitar redução de deslocamento.` : ''} É preciso ter proficiência para usar sem penalidades.`, 145);
  if (field.step === 'equipment') return make(`Esta opção fornece ${label.toLowerCase()} como equipamento inicial. Armas exigem proficiência para somar o bônus ao ataque; armaduras definem a defesa e podem afetar a furtividade. Abra a tabela do livro para comparar dano, peso, preço e propriedades.`, 145);
  return make(`${label} é uma escolha de ${field.label.toLowerCase()}. Escolha até ${field.count} opção(ões) desta lista. Os efeitos dependem da classe e do nível; consulte a regra completa abaixo antes de decidir.`, E.data.classes[d.classId]?.page || 45);
}
export const stepHelp: Record<string, string> = {
  identity: 'A classe define suas capacidades de aventura; a raça traz características próprias; o antecedente conta o que você fazia antes de se aventurar. Abra “Consultar” para ler cada escolha.',
  attributes: 'As seis habilidades representam capacidades do personagem. Valores altos favorecem os testes ligados a elas. Os bônus da raça entram depois da distribuição, uma única vez.',
  proficiencies: 'Proficiência é treinamento: você soma seu bônus nos testes correspondentes (+2 no nível 1). As opções aqui completam as que a raça, a classe e o antecedente já concedem. Abra “Como usar” para comparar.',
  class: 'Estas são as capacidades da sua classe neste nível. Ganhos automáticos entram na ficha; as listas abaixo pedem decisões suas. Abra as descrições para conferir usos e limites.',
  magic: 'Truques não gastam espaços de magia. Magias de nível 1 ou maior costumam gastar espaços; conhecer e preparar são coisas diferentes. A lista indica quantas escolher. Abra a descrição para conferir alcance, duração, componentes e concentração.',
  equipment: 'Escolha entre os conjuntos iniciais da classe. Proficiência com uma arma permite somar o bônus de proficiência ao ataque; usar armadura sem treinamento tem penalidades. Você também recebe os itens e moedas do antecedente.',
  review: 'Confira os números e escolhas. Personalidade, ideais, ligações e defeitos ajudam a interpretar: use sugestões do seu antecedente ou escreva livremente. Nada aqui obriga uma forma única de jogar.',
};
/** Lê as tabelas já extraídas do PDF, mantendo cada linha numerada como uma sugestão. */
export function backgroundSuggestions(backgroundId: string, backgrounds = root.CharacterEngine.options.backgrounds, refs = root.PHB_REFERENCES) {
  const result: Record<string, string[]> = { traits:[], ideals:[], bonds:[], flaws:[] };
  const name = backgrounds[backgroundId]?.name;
  if (!name) return result;
  const start = refs.findIndex((r: any) => normal(r.name) === normal(name));
  if (start < 0) return result;
  const names = Object.values(backgrounds).map((b: any) => normal(b.name));
  const next = refs.findIndex((r: any, i: number) => i > start && names.includes(normal(r.name)));
  const sections = refs.slice(start + 1, next < 0 ? undefined : next);
  let category = '', current = '';
  const flush = () => { if (category && current) result[category].push(current.replace(/-\s+/g, '-').trim()); current = ''; };
  for (const section of sections) {
    category = ''; current = '';
    for (const line of section.text.split('\n')) {
    const heading = line.trim().match(/^d[68]\s+(Traço de Personalidade|Ideal|Vínculo|Defeito)/i);
    if (heading) { flush(); category = ({'traço de personalidade':'traits', ideal:'ideals', 'vínculo':'bonds', defeito:'flaws'} as Record<string,string>)[heading[1].toLowerCase()]; continue; }
    if (!category || !line.trim()) continue;
    const row = line.match(/^\s*([1-8])\s+(.+)/);
    if (row) { flush(); current = row[2]; } else if (current) current += ' ' + line.trim();
    }
    flush();
  }
  return result;
}
export function suggestionsMarkup(backgroundId: string, key: string) {
  const suggestions = backgroundSuggestions(backgroundId)[key];
  if (!suggestions?.length) return '';
  return `<div class="cw-suggestions"><button type="button" class="cw-suggestion-trigger" data-suggestion-trigger="${key}" aria-haspopup="listbox" aria-expanded="false">Sugestões do Livro do Jogador</button></div>`;
}
