import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canConfigureSheet,isSheetUnlocked,setSheetUnlocked,syncSheetLock} from '../src/sheet-edit/lock';
import {canEditSheet,setSheetAuthorityProvider} from '../src/sheet-edit/access';
import {selectWorkspace} from '../src/storage/account-scope';

test('cadeado inicia fechado, não altera dados e mantém a autorização de jogo separada',()=>{
 const c={id:'ficha-cadeado',name:'Exemplo',rules:{}};syncSheetLock(undefined);syncSheetLock(c);assert.equal(canEditSheet(c),true);assert.equal(canConfigureSheet(c),false);
 const before=JSON.stringify(c);assert.equal(setSheetUnlocked(c,true),true);assert.equal(canConfigureSheet(c),true);syncSheetLock(c);assert.equal(isSheetUnlocked(c),true);setSheetUnlocked(c,false);assert.equal(canConfigureSheet(c),false);assert.equal(canEditSheet(c),true);assert.equal(JSON.stringify(c),before);
});
test('trocar ficha ou conta protege novamente, mesmo quando o ID da ficha é igual',()=>{
 const c={id:'origem'};syncSheetLock(c);setSheetUnlocked(c,true);syncSheetLock({id:'outra'});assert.equal(isSheetUnlocked(c),false);syncSheetLock(c);assert.equal(isSheetUnlocked(c),false);setSheetUnlocked(c,true);
 try{selectWorkspace({project:'teste',userId:'outra-conta'});assert.equal(canConfigureSheet(c),false);syncSheetLock(c);assert.equal(isSheetUnlocked(c),false);setSheetUnlocked(c,true);selectWorkspace(null);assert.equal(canConfigureSheet(c),false);syncSheetLock(c);assert.equal(isSheetUnlocked(c),false);}finally{selectWorkspace(null);syncSheetLock(undefined);}
});
test('abrir cadeado não contorna permissão negada pelo contexto da sala',()=>{
 const c={id:'permissao',rules:{unlocked:true,canEdit:true}};syncSheetLock(c);
 try{setSheetAuthorityProvider(()=>({kind:'room',role:'player',playerCanEdit:false}));assert.equal(setSheetUnlocked(c,true),false);assert.equal(canConfigureSheet(c),false);setSheetAuthorityProvider(()=>({kind:'room',role:'gm',playerCanEdit:false}));assert.equal(setSheetUnlocked(c,true),true);assert.equal(canConfigureSheet(c),true);setSheetAuthorityProvider(()=>({kind:'room',role:'player',playerCanEdit:false}));assert.equal(canConfigureSheet(c),false);}finally{setSheetAuthorityProvider(()=>({kind:'personal'}));syncSheetLock(undefined);}
});
