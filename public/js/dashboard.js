const $=id=>document.getElementById(id);
const input=$('inputText'), output=$('outputText'), issues=$('issues');
let undoStack=[], history=[], timer=null, requestId=0, lastApplied='';
const localFallback={teh:'the',thier:'their',recieve:'receive',beleive:'believe',wierd:'weird',freind:'friend',definately:'definitely',seperate:'separate',occured:'occurred',untill:'until',tommorow:'tomorrow',adress:'address',becuase:'because',langauge:'language',programing:'programming',grammer:'grammar',acheive:'achieve',studing:'studying',studyng:'studying',scince:'science',sceince:'science',happi:'happy',helo:'hello',wrld:'world',wrold:'world',thnaks:'thanks',comuter:'computer',computr:'computer',progam:'program',corret:'correct',speling:'spelling',correctiong:'correcting'};
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function countWords(s){return (s.trim().match(/\S+/g)||[]).length;}
function updateCounts(){ $('wordCount').textContent=countWords(input.value)+' words'; }
function fallbackCheck(text){let matches=[];let corrected=text.replace(/[A-Za-z']+/g,(word,offset)=>{let r=localFallback[word.toLowerCase()];if(!r)return word; if(word===word.toUpperCase())r=r.toUpperCase();else if(word[0]===word[0].toUpperCase())r=r[0].toUpperCase()+r.slice(1);matches.push({original:word,replacements:[r],offset,length:word.length,message:'Common spelling error'});return r;});return {corrected,matches,engine:'Local fallback'};}
async function checkText(text){const id=++requestId;try{const response=await fetch('/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,language:'en-US'})});if(!response.ok)throw new Error('Spell-check request failed');const data=await response.json();if(id!==requestId)return null;return data;}catch(e){if(id!==requestId)return null;return fallbackCheck(text);}}
function renderResult(data, original, applyToEditor){if(!data)return;const changes=data.matches||[];const corrected=data.corrected??original;
  if(applyToEditor && corrected!==original){undoStack.push(original);input.value=corrected;}
  output.innerHTML=escapeHTML(corrected).replace(/\n/g,'<br>');
  $('mistakeCount').textContent=changes.length+' issue'+(changes.length===1?'':'s');
  $('checkedStat').textContent=countWords(original);$('fixedStat').textContent=changes.length;$('engineStat').textContent=data.engine||'Spell checker';$('engineName').textContent=data.engine||'Spell checker';
  $('resultStatus').textContent=changes.length?`${changes.length} suggestion(s) found`:'No spelling issues found';
  if(changes.length){issues.innerHTML=changes.map(m=>{const to=m.replacements?.[0]||'No suggestion';return `<div class="issue"><div><strong>${escapeHTML(m.original||'')}</strong> <span>→</span> <b>${escapeHTML(to)}</b><small>${escapeHTML(m.message||'Possible error')}</small></div><em>${m.replacements?.length?'✓ corrected':'Review'}</em></div>`;}).join('');}
  else issues.innerHTML='<p class="muted">No likely spelling or grammar mistakes were found.</p>';
  if(corrected!==original){history.unshift({from:original,to:corrected,count:changes.length});history=history.slice(0,6);$('historyList').innerHTML=history.map(h=>`<div class="history-entry"><b>${h.count} correction(s)</b><span>${escapeHTML(h.to)}</span></div>`).join('');}
  if(data.warning){$('engineStatus').textContent='LOCAL FALLBACK ACTIVE';$('engineStatus').parentElement.classList.add('offline');}else{$('engineStatus').textContent='SPELL CHECKER READY';$('engineStatus').parentElement.classList.remove('offline');}
}
async function fullCheck(){const text=input.value;if(!text.trim()){$('resultStatus').textContent='Enter some text first';return;} $('resultStatus').textContent='Checking your text…';const data=await checkText(text);if(data)renderResult(data,text,true);}
async function autoCheckLastWord(){const cursor=input.selectionStart;const left=input.value.slice(0,cursor);const m=left.match(/([A-Za-z']+)([\s.,!?;:])$/);if(!m)return;const word=m[1];if(word.length<2)return;const start=cursor-m[0].length;const original=input.value;const data=await checkText(word);if(!data||!data.matches?.length)return;
  const replacement=data.corrected;if(!replacement||replacement.toLowerCase()===word.toLowerCase())return;
  // Ignore stale responses if the user continued editing before the API returned.
  if(input.value!==original||input.selectionStart!==cursor)return;
  undoStack.push(original);input.setRangeText(replacement,start,start+word.length,'end');
  const whole=input.value;const single={...data,corrected:whole,matches:data.matches.map(x=>({...x,original:word,replacements:[replacement]}))};
  output.innerHTML=escapeHTML(whole).replace(/\n/g,'<br>');issues.innerHTML=`<div class="issue"><div><strong>${escapeHTML(word)}</strong> <span>→</span> <b>${escapeHTML(replacement)}</b><small>Automatically corrected</small></div><em>✓ corrected</em></div>`;
  $('mistakeCount').textContent='1 correction';$('checkedStat').textContent=countWords(whole);$('fixedStat').textContent='1';$('engineName').textContent=data.engine||'Spell checker';$('engineStat').textContent=data.engine||'Spell checker';$('resultStatus').textContent=`“${word}” corrected to “${replacement}”`;
  history.unshift({from:original,to:whole,count:1});history=history.slice(0,6);$('historyList').innerHTML=history.map(h=>`<div class="history-entry"><b>${h.count} correction(s)</b><span>${escapeHTML(h.to)}</span></div>`).join('');updateCounts();
}
input.addEventListener('input',()=>{updateCounts();clearTimeout(timer);const val=input.value;const pos=input.selectionStart;const tail=val.slice(0,pos);if(/[\s.,!?;:]$/.test(tail)){timer=setTimeout(autoCheckLastWord,180);}});
$('checkBtn').addEventListener('click',fullCheck);
$('undoBtn').addEventListener('click',()=>{if(!undoStack.length){$('resultStatus').textContent='Nothing to undo yet';return;}input.value=undoStack.pop();updateCounts();output.textContent=input.value||'Your corrected sentence will appear here.';$('resultStatus').textContent='Previous text restored';$('mistakeCount').textContent='0 issues';});
$('clearBtn').addEventListener('click',()=>{if(input.value)undoStack.push(input.value);input.value='';output.textContent='Your corrected sentence will appear here.';issues.innerHTML='<p class="muted">Mistakes and suggestions will appear here.</p>';$('mistakeCount').textContent='0 issues';$('checkedStat').textContent='0';$('fixedStat').textContent='0';$('resultStatus').textContent='Waiting for your text';updateCounts();});
$('copyBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.innerText);$('resultStatus').textContent='Corrected text copied';}catch(e){$('resultStatus').textContent='Copy is not available in this browser';}});
(async()=>{try{const r=await fetch('/api/health');if(!r.ok)throw 0;const d=await r.json();$('engineStatus').textContent='SPELL CHECKER READY';$('engineName').textContent=`LanguageTool + ${Number(d.datasetEntries||0).toLocaleString()} local typo pairs`;$('engineStat').textContent='LanguageTool';}catch(e){$('engineStatus').textContent='LOCAL MODE';$('engineName').textContent='Local fallback';$('engineStat').textContent='Local fallback';}})();updateCounts();
