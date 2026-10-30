import type {Sheet} from './model';

export interface PaidCommand {source:string;name:string;die:number;ally:string}
let commands=new WeakMap<Sheet,PaidCommand>();
/** Só a ordem desta sessão, sem alvo/face/turno no documento compartilhável.
 * O ataque é imediato na mesa; a interface registra o bônus desse ataque,
 * sem tentar reconstruir sua cronologia pelas outras rolagens da bandeja. */
export const currentCommand=(c:Sheet)=>commands.get(c);
export const holdCommand=(c:Sheet,command:PaidCommand)=>{commands.set(c,command);return command;};
export function endCommand(c:Sheet) {const command=commands.get(c);commands.delete(c);return command;}
export const clearCommands=()=>{commands=new WeakMap();};
