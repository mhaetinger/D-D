import {escape,type Sheet} from '../rules/model';

/** Ícones decorativos e formatos diferentes reforçam a hierarquia sem depender
 * de cores. Textos do arquivo continuam escapados e editáveis na cópia. */
export const reviewIcon=(name:string)=>`<i data-lucide="${name}" aria-hidden="true"></i>`;
export const reviewCard=(title:string,content:string,icon='scroll-text',variant='')=>`<section class="import-card ${variant}"><h3>${reviewIcon(icon)}<span>${title}</span></h3>${content}</section>`;
type Field=(c:Sheet,path:string,label:string,type?:string,required?:boolean,min?:number,max?:number)=>string;
export function identityFields(c:Sheet,fields:Field,races:string):string {
  return reviewCard('Quem é o personagem',`<div class="import-grid import-identity-grid"><div class="import-character-name">${fields(c,'name','Nome do personagem','text',true)}</div>${fields(c,'playerName','Nome do jogador')}${fields(c,'background','Antecedente')}${fields(c,'alignment','Tendência')}${fields(c,'race','Raça como está no arquivo')}<label>Raça para as regras da ficha<select required data-import-race>${races}</select></label>${fields(c,'xp','Experiência','number',false,0)}</div>`,'scroll-text','import-identity');
}
const loreLabels={traits:'Traços de personalidade',ideals:'Ideais',bonds:'Vínculos',flaws:'Defeitos',backstory:'História',appearance:'Aparência',allies:'Aliados e organizações',treasure:'Tesouros e outros pertences'};
export function historyFields(c:Sheet):string {
  const area=(key:keyof typeof loreLabels,rows=3)=>`<label class="import-lore-${key}">${loreLabels[key]}<textarea rows="${rows}" data-import-field="lore.${key}" aria-label="${loreLabels[key]}">${escape(c.lore?.[key]||'')}</textarea></label>`;
  return reviewCard('Personalidade',`<div class="import-grid import-personality">${(['traits','ideals','bonds','flaws'] as const).map(key=>area(key,2)).join('')}</div>`,'user-check','import-narrative')+
    reviewCard('História e aparência',`<div class="import-grid import-history">${area('backstory',5)}${area('appearance')}${area('allies')}</div>`,'book-open','import-narrative')+
    reviewCard('Inventário e tesouros',`<div class="import-belongings">${c.inventoryItems.length?`<ul>${c.inventoryItems.map((item:Sheet)=>`<li><strong>${escape(item.name)}</strong><span>× ${escape(item.qty)}</span></li>`).join('')}</ul>`:'<p class="import-field-help">Nenhum item convertido em inventário. Equipamentos que vieram como texto podem acompanhar as anotações pessoais opcionais.</p>'}<p class="import-coins">${Object.entries(c.coins).map(([unit,amount])=>`<span><strong>${escape(amount)}</strong> ${escape(unit.toUpperCase())}</span>`).join('')}</p>${area('treasure')}</div>`,'shopping-bag','import-belongings-card');
}
export const PROFICIENCY_HELP='Proficiência é o treino nesta perícia. Soma o bônus de proficiência da ficha ao modificador do atributo. Sem treino, usa apenas o atributo e outros ajustes. Um total manual preenchido substitui esse cálculo.';
export const EXPERTISE_HELP='Especialização dobra apenas o bônus de proficiência, não o resultado inteiro. Exige uma característica que conceda isso. Marcar também seleciona Proficiente; não é um treino extra concedido pela importação.';
export const MANUAL_SKILL_HELP='Este é o total final escrito no arquivo, já com os bônus. Ele substitui o cálculo por atributo e treino. Deixe vazio para a ficha calcular automaticamente.';
