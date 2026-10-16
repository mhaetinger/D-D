// Cada execução cria sua instância descartável. Nunca aceita URL de banco existente.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawnSync, spawn } = require('node:child_process');
exports.postgres = function () {
  const bin = process.env.CRITCALL_TEST_POSTGRES_BIN;
  const container = `critcall-sync-test-${randomUUID()}`;
  const directory = bin ? fs.mkdtempSync(path.join(os.tmpdir(), 'critcall-postgres-')) : null;
  const run = (command, args) => spawnSync(command, args, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  const command = () => bin
    ? [path.join(bin, 'psql'), ['-h', directory, '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1']]
    : ['docker', ['exec', '-i', container, 'psql', '-h', '127.0.0.1', '-U', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1']];
  return {
    start() {
      if (!bin) return run('docker', ['run', '--rm', '--detach', '--network', 'none', '--name', container, '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', process.env.CRITCALL_TEST_POSTGRES_IMAGE || 'postgres:16-alpine']);
      const init = run(path.join(bin, 'initdb'), ['-D', path.join(directory, 'data'), '-U', 'postgres', '-A', 'trust', '--no-locale', '--encoding=UTF8']);
      if (init.status) return init;
      return run(path.join(bin, 'pg_ctl'), ['-D', path.join(directory, 'data'), '-l', path.join(directory, 'log'), '-o', `-F -k ${directory} -h ''`, '-w', 'start']);
    },
    ready() { return bin ? run(path.join(bin, 'pg_isready'), ['-h', directory]) : run('docker', ['exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres']); },
    sql(input) { const [cmd,args] = command(); return spawnSync(cmd,args,{input,encoding:'utf8',maxBuffer:1024*1024}); },
    concurrent(input) {
      return new Promise((resolve,reject) => {
        const [cmd,args] = command(), child=spawn(cmd,args); let out='',err='';
        child.stdout.on('data',part=>{out+=part;}); child.stderr.on('data',part=>{err+=part;});
        child.on('error',reject); child.on('exit',code=>code===0?resolve(out):reject(new Error(err))); child.stdin.end(input);
      });
    },
    stop() {
      if (!bin) { run('docker',['rm','--force',container]); return; }
      run(path.join(bin,'pg_ctl'),['-D',path.join(directory,'data'),'-m','immediate','-w','stop']);
      fs.rmSync(directory,{recursive:true,force:true});
    },
  };
};
