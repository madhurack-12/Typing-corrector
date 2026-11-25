const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const ROOT = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'typo_dataset.json');
let typoMap = new Map();
try { const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); typoMap = new Map(data.pairs.map(p => [p.mistyped.toLowerCase(), p.correct])); console.log(`Loaded ${typoMap.size} typo pairs`); } catch (error) { console.warn('Typo dataset could not be loaded:', error.message); }
const TYPES = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};

function send(res, status, data, type='application/json; charset=utf-8') {
  res.writeHead(status, {'Content-Type':type,'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'});
  res.end(typeof data === 'string' ? data : JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>1000000) reject(new Error('Text is too long'));});req.on('end',()=>{try{resolve(JSON.parse(raw||'{}'));}catch(e){reject(e);}});req.on('error',reject);});
}
async function checkWithLanguageTool(text, language='en-US') {
  const body = new URLSearchParams({text, language, enabledOnly:'false'});
  const response = await fetch('https://api.languagetool.org/v2/check', {
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body,
    signal:AbortSignal.timeout(12000)
  });
  if(!response.ok) throw new Error(`LanguageTool returned HTTP ${response.status}`);
  const data = await response.json();
  const matches = (data.matches || []).map(m => ({
    message:m.message, offset:m.offset, length:m.length,
    original:text.slice(m.offset,m.offset+m.length),
    replacements:(m.replacements||[]).slice(0,5).map(r=>r.value),
    rule:m.rule?.id || 'SPELLING', category:m.rule?.category?.name || 'Spelling'
  }));
  let corrected=text;
  // Apply suggestions from right to left so offsets remain valid.
  const applicable = matches.filter(m=>m.replacements.length).sort((a,b)=>b.offset-a.offset);
  for(const m of applicable) corrected = corrected.slice(0,m.offset)+m.replacements[0]+corrected.slice(m.offset+m.length);
  return {corrected,matches,engine:'LanguageTool',language};
}
const localFixes = {
  teh:'the', thier:'their', recieve:'receive', beleive:'believe', wierd:'weird', freind:'friend',
  definately:'definitely', definetly:'definitely', seperate:'separate', occured:'occurred', untill:'until',
  tommorow:'tomorrow', adress:'address', becuase:'because', becouse:'because', langauge:'language',
  programing:'programming', grammer:'grammar', acheive:'achieve', studing:'studying', studyng:'studying',
  scince:'science', sceince:'science', happi:'happy', helo:'hello', helllo:'hello', wrld:'world',
  wrold:'world', thnaks:'thanks', comuter:'computer', computr:'computer', progam:'program',
  corret:'correct', speling:'spelling', spellling:'spelling', mispell:'misspell', agian:'again',
  waht:'what', whih:'which', whta:'what', becaus:'because', correctiong:'correcting'
};
function localCheck(text) {
  const matches=[];
  const corrected=text.replace(/[A-Za-z']+/g, (word, offset)=>{
    const replacement=typoMap.get(word.toLowerCase()) || localFixes[word.toLowerCase()];
    if(!replacement) return word;
    const value=word===word.toUpperCase()?replacement.toUpperCase():word[0]===word[0].toUpperCase()?replacement[0].toUpperCase()+replacement.slice(1):replacement;
    matches.push({message:'Possible spelling mistake',offset,length:word.length,original:word,replacements:[value],rule:'LOCAL_DICTIONARY',category:'Spelling'});
    return value;
  });
  return {corrected,matches,engine:'Local fallback',language:'en-US'};
}
const server=http.createServer(async(req,res)=>{
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/health') return send(res,200,{ok:true,engine:'LanguageTool + local typo dataset',datasetEntries:typoMap.size});
  if(url.pathname==='/api/dataset' && req.method==='GET') return send(res,200,{entries:typoMap.size,source:'data/typo_dataset.json',kind:'synthetic typo pairs'});
  if(url.pathname==='/api/check' && req.method==='POST'){
    try{
      const {text,language='en-US'}=await readBody(req);
      if(typeof text!=='string') return send(res,400,{error:'Text must be a string'});
      if(text.length>50000) return send(res,413,{error:'Please keep text under 50,000 characters'});
      if(!text.trim()) return send(res,200,{corrected:text,matches:[],engine:'Ready',language});
      try { return send(res,200,await checkWithLanguageTool(text,language)); }
      catch(error){ const result=localCheck(text); result.warning='Online spelling service is unavailable. Local common-word correction was used.'; return send(res,200,result); }
    }catch(error){return send(res,400,{error:error.message||'Invalid request'});}
  }
  let pathname=decodeURIComponent(url.pathname);
  if(pathname==='/') pathname='/index.html';
  const file=path.normalize(path.join(ROOT,pathname));
  if(!file.startsWith(ROOT)) return send(res,403,{error:'Forbidden'});
  fs.readFile(file,(err,content)=>{
    if(err) return send(res,404,'Not found','text/plain; charset=utf-8');
    res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]||'application/octet-stream'});res.end(content);
  });
});
server.listen(PORT,()=>console.log(`TypeFix is running at http://localhost:${PORT}`));
