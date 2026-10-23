#!/usr/bin/env python3
"""Extrai o catálogo do PDF local; não consulta serviços nem executa scripts do PDF.

As três colunas das listas precisam ser lidas separadamente: extrair a página
inteira mistura títulos de níveis e poderia atribuir magias à classe errada.
"""
from pathlib import Path
import json, re, subprocess, unicodedata

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / 'public' / 'books' / 'livro-jogador-2014.pdf'
def key(value):
    return re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower()).strip('-')
# A própria lista do PDF contém estas diferenças de grafia entre classes.
ALIASES={'infringir-ferimentos':'infligir-ferimentos','banquete-dos-herois':'banquete-de-herois','enfraquecer-o-intelecto':'enfraquecer-intelecto'}
def spell_key(value):
    normalized=key(value)
    return ALIASES.get(normalized,normalized)
def crop(page, x, y, width, height):
    return subprocess.check_output(['pdftotext', '-f', str(page), '-l', str(page), '-x', str(x), '-y', str(y), '-W', str(width), '-H', str(height), '-layout', str(PDF), '-'], text=True).replace('\f', '')

classes = {'bardo':'bardo', 'bruxo':'bruxo', 'clerigo':'clerigo', 'druida':'druida', 'feiticeiro':'feiticeiro', 'mago':'mago', 'paladino':'paladino', 'patrulheiro':'patrulheiro'}
spells = {}
current = None
level = None
pending = ''
for page in range(207, 213):
    for x in [33, 213, 392]:
        y = 195 if page == 207 else 45
        for line in crop(page, x, y, 179, 798-y).splitlines():
            line = line.strip()
            if not line: continue
            if line.startswith('MAGIAS DE '):
                current = classes[key(line.removeprefix('MAGIAS DE '))]
                pending = ''
                continue
            if 'TRUQUES' in line and '0' in line:
                level = 0
                continue
            match = re.match(r'([1-9])[°º] NÍVEL', line)
            if match:
                level = int(match[1])
                continue
            if current is None or level is None: continue
            pending = (pending+' '+line).strip()
            if ')' not in pending: continue
            match = re.match(r'(.+?)\s*\((.+)\)', pending)
            if match:
                name, school = match.groups()
                sid=spell_key(name)
                spell = spells.setdefault(sid, {'id':sid, 'name':name, 'level':level, 'school':school.split(',')[0].strip(), 'ritual':'ritual' in school, 'classes':[], 'pdfPage':page})
                assert spell['level']==level, (spell, current, level)
                if current not in spell['classes']: spell['classes'].append(current)
            pending = ''

# Metadados e resumos nas duas colunas das descrições. Mantém ligação ao PDF.
segments=[]
active=None
for page in range(213, 289):
    for x in [33, 304]:
        text=crop(page,x,45,263,753)
        lines=text.splitlines()
        for i,line in enumerate(lines):
            normalized=spell_key(line.strip())
            if normalized in spells and line.strip().upper()==line.strip():
                upcoming=' '.join(lines[i+1:i+3]).lower()
                if 'nível' in upcoming or 'truque de' in upcoming:
                    active={'id':normalized,'page':page,'lines':[]}
                    segments.append(active)
                    continue
            if active is not None: active['lines'].append(line)
for segment in segments:
    name,page,text=segment['id'],segment['page'],'\n'.join(segment['lines'])
    spell=spells[name]
    if 'time' in spell: continue
    spell['pdfPage']=page
    for field,label in [('time','Tempo de Conjuração'),('range','Alcance'),('components','Componentes')]:
        # Campos longos continuam na linha seguinte; o próximo rótulo encerra
        # o campo. O corpo completo permanece preservado separadamente.
        m=re.search(rf'{label}:\s*(.*?)(?=\n\s*(?:Alcance|Componentes|Duração):)',text,re.S)
        if m: spell[field]=re.sub(r'\s+',' ',m.group(1)).strip()
    m=re.search(r'Duração:\s*([^\n]+)',text)
    if m: spell['duration']=m.group(1).strip()
    spell['concentration']='concentração' in spell.get('duration','').lower()
    spell['text']=text.strip()

# Correção editorial explícita do catálogo, não alteração do PDF nem errata
# oficial da tradução. Destructive Wave (PHB 2014, p. 231) usa d6; este exemplar
# imprime 5d5 no componente trovejante. A consulta deve exibir a divergência.
wave=spells['onda-destrutiva']
assert wave['text'].count('5d5')==1, 'Revisar a correção editorial de Onda Destrutiva se a fonte mudar.'
wave['text']=wave['text'].replace('5d5','5d6',1)
wave['sourceNote']='Correção editorial do CritCall: o PDF local imprime 5d5 trovejante; o catálogo usa 5d6, conforme Destructive Wave de 2014 (PHB, p. 231). O PDF original foi preservado.'

# Seções locais para consulta das características, sem depender de serviços externos.
# O número do rodapé é o impresso; pdfPage é sempre o índice correto para #page=.
references=[]
race_parts=[]
active=None
for page in range(16,172):
    footer=crop(page,0,780,600,61)
    numbers=re.findall(r'\b(\d{1,3})\b',footer)
    printed=int(numbers[-1]) if numbers else page
    for x in [33,304]:
        # A última linha do corpo chega a y=795. Cortar em 780 removia finais
        # de regras (ex.: Ataque de Precisão e Passo Evasivo). O rodapé fica fora.
        part=crop(page,x,45,263,753)
        if page<=43: race_parts.append((page,printed,part))
        lines=part.splitlines()
        for line in lines:
            title=line.strip()
            if len(title)>=3 and re.match(r'^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9 ,:–’º°()/+\-]+$',title) and len(title)<90:
                # Este nome de conclave ocupa duas linhas no PDF.
                if active and active['name']=='CONCLAVE DO RASTREADOR' and title=='SUBTERRÂNEO':
                    active['name'] += ' '+title
                    active['id'] = key(active['name'])
                    continue
                active={'name':title,'id':key(title),'pdfPage':page,'page':printed,'lines':[]}
                references.append(active)
            elif active is not None: active['lines'].append(line)
for ref in references: ref['text']='\n'.join(ref.pop('lines')).strip()
# Traços raciais em negrito são parágrafos, não cabeçalhos em maiúsculas.
# Captura todos os nomes usados pelas raças e seus rótulos básicos, inclusive
# continuações entre colunas. Um quadro lateral não vira o texto de outro traço.
races=json.loads(subprocess.check_output(['node','-e',
    "process.stdout.write(JSON.stringify(require(process.argv[1]).races))",
    str(ROOT/'public'/'rules'/'phb2014-options.js')],text=True))
names={key(re.sub(r'\s*\([^)]*\)','',name)):re.sub(r'\s*\([^)]*\)','',name)
       for race in races.values() for name in race['traits']}
for label in ['Aumento no Valor de Habilidade','Idade','Tendência','Tamanho',
              'Deslocamento','Idiomas','Sub-raça','Sub-raças','Perícia','Ilusionista Nato']:
    names[key(label)]=label
joined=''; parts=[]
for page,printed,text in race_parts:
    parts.append((len(joined),len(joined)+len(text),page,printed))
    joined+=text+'\n'
labels='|'.join('\\s+'.join(re.escape(word) for word in name.split()) for name in sorted(names.values(),key=len,reverse=True))
paragraphs=list(re.finditer(r'(?im)^[ \t]*('+labels+r')[.:]\s*',joined))
headings=list(re.finditer(r'(?m)^[ \t]*[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9 ,:–’º°()/+\-]{2,88}[ \t]*$',joined))
boundaries=sorted({m.start() for m in paragraphs+headings})
for match in paragraphs:
    end=next((n for n in boundaries if n>match.start()),len(joined))
    body=re.sub(r'\s+',' ',joined[match.end():end]).strip()
    if not body: continue
    page,printed=next((page,printed) for start,stop,page,printed in parts if start<=match.start()<stop)
    label=names[key(re.sub(r'\s+',' ',match.group(1)))]; ident=key(label)
    assert len(body)<8000, ('Parágrafo racial misturado',label,page)
    references.append({'name':label,'id':ident,'pdfPage':page,'page':printed,'text':body,'kind':'race'})
refout=ROOT/'public'/'rules'/'phb2014-references.js'
refout.write_text('// Gerado do PDF local. Referências de consulta, não regras executáveis.\n(function(root){const data='+json.dumps(references,ensure_ascii=False,separators=(',',':'))+';if(typeof module!=="undefined")module.exports=data;else root.PHB_REFERENCES=data;})(globalThis);\n')

result=sorted(spells.values(),key=lambda s:(s['level'],s['name']))
# Tabelas de equipamento: preserva os pesos da tradução local, inclusive onde
# divergem de outros catálogos. Travessão significa peso desprezível no livro.
weapons=[]
kind=None
for line in crop(150,33,45,534,735).splitlines():
    line=line.strip()
    if line.startswith('Armas Simples Corpo'): kind='simpleMelee';continue
    if line.startswith('Armas Simples à'): kind='simpleRanged';continue
    if line.startswith('Armas Marciais Corpo'): kind='martialMelee';continue
    if line.startswith('Armas Marciais à'): kind='martialRanged';continue
    m=re.match(r'(.+?)\s+([\d.,]+)\s+(p[cpelo])\s+(\d+d\d+|\d+|–)\s*(perfurante|cortante|concussão)?\s+(?:(\d+(?:,\d+)?)\s*kg|(–))\s*(.*)',line)
    if m and kind:
        name,cost,coin,damage,damageType,weight,negligible,props=m.groups()
        if name=='Beste Leve': name='Besta Leve' # erro de digitação na tabela
        weapons.append({'name':name,'damage':'0' if damage=='–' else damage,'damageType':damageType or '', 'kind':kind,'weight':float((weight or '0').replace(',','.')),'properties':props,'cost':cost+' '+coin,'pdfPage':150})
assert len(weapons)==37,len(weapons)
gear=[]
for x in [33,304]:
    prefix=''
    for line in crop(151,x,45,263,735).splitlines():
        line=line.strip()
        if line in ['Foco arcano','Foco druídico','Símbolo sagrado']: prefix=line;continue
        m=re.match(r'(.+?)\s+([\d.,]+)\s*(p[cpelo])\s+(?:(\d+(?:,\d+)?)\s*kg|(–))\s*$',line)
        if not m: continue
        name,cost,coin,weight,negligible=m.groups()
        if name in ['Fogo alquímico (frasco)','Sinete']:prefix=''
        gear.append({'name':(prefix+': ' if prefix else '')+name,'weight':float((weight or '0').replace(',','.')),'cost':cost+' '+coin,'pdfPage':151})
equipmentout=ROOT/'public'/'rules'/'phb2014-equipment.js'
equipmentout.write_text('// Gerado das tabelas do livro local; pesos em kg.\n(function(root){const data='+json.dumps({'weapons':weapons,'gear':gear},ensure_ascii=False,separators=(',',':'))+';if(typeof module!=="undefined")module.exports=data;else root.PHB_EQUIPMENT=data;})(globalThis);\n')
out=ROOT/'public'/'rules'/'phb2014-spells.js'
out.parent.mkdir(exist_ok=True)
out.write_text('// Gerado por scripts/extract-phb.py a partir do Livro D&D.pdf local.\n(function(root){const data='+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';if(typeof module!=="undefined")module.exports=data;else root.PHB_SPELLS=data;})(globalThis);\n')
print(json.dumps({'spells':len(result),'withMetadata':sum('time'in s for s in result),'classes':{c:sum(c in s['classes'] for s in result)for c in classes}},ensure_ascii=False))
