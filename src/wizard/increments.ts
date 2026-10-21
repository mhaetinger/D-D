import { abilityCard, labels } from './abilities';

type Answers = Record<string,any>;
const chosen = (a:Answers):string[] => Array.isArray(a.asi)?a.asi:typeof a.asi==='string'?[a.asi]:[];
export function adjustIncrement(a:Answers,base:Record<string,number>,key:string,delta:number,budget=2) {
  if (!Object.hasOwn(labels,key) || ![1,-1].includes(delta)) return false;
  const values=chosen(a),count=values.filter(k=>k===key).length;
  if (delta>0) {
    if (values.length>=budget || base[key]+count>=20) return false;
    a.asi=[...values,key];
  } else {
    const index=values.lastIndexOf(key);if(index<0) return false;
    a.asi=values.filter((_,i)=>i!==index);
  }
  return true;
}

/** Reutiliza os cards da criação; o contrato continua sendo dois códigos em answers.asi. */
export function incrementMarkup(field:{count:number}) {
  return `<fieldset class="cw-choice cw-asi-grid" data-choice="asi" data-increment-budget="${field.count}"><legend>Distribua +2 em uma habilidade ou +1 em duas</legend><p class="cw-ability-status" data-increment-status role="status"></p><div class="cw-grid">${Object.entries(labels).map(([key,name])=>abilityCard(key,`<span class="cw-muted" data-increment-base></span><div class="cw-stepper"><button type="button" data-increment="-1" aria-label="Diminuir incremento de ${name}">−</button><output data-increment-value aria-label="${name} após o incremento"></output><button type="button" data-increment="1" aria-label="Aumentar incremento de ${name}">+</button></div><span class="cw-muted" data-increment-change></span>`,false)).join('')}</div></fieldset>`;
}

export function bindIncrements(host:HTMLElement,base:Record<string,number>,answers:Answers,save:()=>void) {
  const panel=host.querySelector<HTMLElement>('[data-increment-budget]');
  if(!panel || panel.dataset.incrementBound) return;
  panel.dataset.incrementBound='true';
  const budget=Number(panel.dataset.incrementBudget);
  function update() {
    const values=chosen(answers);
    panel!.querySelector('[data-increment-status]')!.textContent=`${Math.max(0,budget-values.length)} de ${budget} pontos disponíveis · Máximo 20.`;
    for(const card of panel!.querySelectorAll<HTMLElement>('[data-ability-card]')) {
      const key=card.dataset.abilityCard!,count=values.filter(k=>k===key).length;
      card.querySelector('[data-increment-base]')!.textContent=`Atual: ${base[key]}`;
      card.querySelector('[data-increment-value]')!.textContent=String(base[key]+count);
      card.querySelector('[data-increment-change]')!.textContent=count?`+${count} neste nível`:'Sem aumento';
      for(const button of card.querySelectorAll<HTMLButtonElement>('[data-increment]')) button.disabled=button.dataset.increment==='1'?values.length>=budget || base[key]+count>=20:count===0;
    }
  }
  panel.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-increment]');
    if(button && adjustIncrement(answers,base,button.closest<HTMLElement>('[data-ability-card]')!.dataset.abilityCard!,Number(button.dataset.increment),budget)) { update();save(); }
  });
  update();
}
