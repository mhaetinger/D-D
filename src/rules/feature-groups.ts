import type { Engine, Sheet } from './model';
import { featureResourceBindings } from './placement';
import type { Resource } from './resources';

type Entry = { gain:Sheet; index:number; controls:Resource[] };
type Group = { key:string; label:string; classId:string; levels:{ level:number; entries:Entry[] }[] };

/** Agrupamento apenas visual: conserva o índice que vincula cada ganho aos
 * seus controles e a origem completa que aparece ao consultar a descrição. */
export function featureGroups(c:Sheet,E:Engine):Group[] {
  const {gains,bindings}=featureResourceBindings(c,E), groups=new Map<string,Group>();
  gains.forEach((gain,index)=>{
    const classId=gain.classId || '', key=classId?`class:${classId}`:`source:${gain.source}`;
    let group=groups.get(key);
    if(!group){
      group={key,label:E.data.classes[classId]?.name || gain.source || 'Outras características',classId,levels:[]};
      groups.set(key,group);
    }
    let level=group.levels.find(x=>x.level===gain.level);
    if(!level){level={level:gain.level,entries:[]};group.levels.push(level);}
    level.entries.push({gain,index,controls:bindings.get(index) || []});
  });
  for(const group of groups.values())group.levels.sort((a,b)=>a.level-b.level);
  return [...groups.values()];
}
