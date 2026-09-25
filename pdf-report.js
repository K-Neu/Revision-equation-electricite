/* Offline PDF report writer with embedded Unicode fonts. */
function createQuizPdf(report) {
  const pages = [];
  let commands = [], y = 794;
  const clean = value => String(value).normalize('NFC').replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/[–—−]/g,'-').replace(/→/g,'->').replace(/\u202f|\u00a0/g,' ').replace(/…/g,'...');
  const hex = n => n.toString(16).padStart(4,'0');
  function text(value,x,baseline,size=11,bold=false) {
    const font=QUIZ_PDF_FONTS[bold?'bold':'regular'];
    const glyphs=Array.from(clean(value),c=>hex((font.metrics[c.codePointAt(0)]||font.metrics[63])[0])).join('');
    commands.push(`BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x} ${baseline} Tm <${glyphs}> Tj ET`);
  }
  function wrap(value,size=11,bold=false) {
    const font=QUIZ_PDF_FONTS[bold?'bold':'regular'];
    const width=s=>Array.from(s).reduce((n,c)=>n+(font.metrics[c.codePointAt(0)]||font.metrics[63])[1]*size/1000,0);
    const lines=[];
    for(const paragraph of clean(value).split('\n')) {
      let line='';
      for(let word of paragraph.split(/\s+/)) {
        if(line&&width(line+' '+word)>507){lines.push(line);line=''}
        while(width(word)>507){let end=1;while(end<word.length&&width(word.slice(0,end+1))<=507)end++;lines.push(word.slice(0,end));word=word.slice(end)}
        line+=(line?' ':'')+word;
      }
      lines.push(line);
    }
    return lines;
  }
  function nextPage(){pages.push(commands);commands=[];y=794;text('Atelier Électricité - Détail des réponses',44,y,13,true);y-=30}
  function block(value,{size=11,bold=false,gap=8}={}){
    const lines=wrap(value,size,bold);
    if(y-lines.length*(size+5)-gap<55)nextPage();
    for(const line of lines){text(line,44,y,size,bold);y-=size+5}
    y-=gap;
  }
  block('Atelier Électricité',{size:20,bold:true});
  block('Bilan de révision',{size:15,bold:true});
  block(report.date+'\nMode : '+report.mode);
  block(report.breakdown,{bold:true});
  block('Barème : '+report.rule+'\nSi les aides ont été affichées, le total brut de la série est divisé par 2.');
  block('Questions, réponses et corrections',{size:14,bold:true});
  report.answers.forEach((answer,index)=>{
    const rows=[
      `${index+1}. ${answer.question}`,
      ...(answer.given.length?['Données : '+answer.given.map(pair=>pair.join(' : ')).join(' ; ')]:[]),
      ...(answer.context?[answer.context]:[]),
      'Réponse donnée : '+answer.response,
      'Correction : '+answer.correction,
      answer.evaluation,
      'Points avant réduction : '+answer.earned.toLocaleString('fr-BE')+' / 1'
    ];
    const height=rows.reduce((n,row,i)=>n+wrap(row,11,i===0).length*16+4,0)+12;
    if(y-height<55)nextPage();
    rows.forEach((row,i)=>block(row,{bold:i===0,gap:4}));
    y-=12;
  });
  pages.push(commands);
  pages.forEach((cmds,i)=>{commands=cmds;text(`Page ${i+1} / ${pages.length}`,44,28,9);});
  const objects=['<< /Type /Catalog /Pages 2 0 R >>',''];
  const add=obj=>{objects.push(obj);return objects.length};
  function embedFont(font,name){
    const data=atob(font.data);
    const file=add(`<< /Length ${data.length} /Length1 ${data.length} >>\nstream\n${data}\nendstream`);
    const descriptor=add(`<< /Type /FontDescriptor /FontName /${name} /Flags 32 /FontBBox [-1100 -500 2100 1600] /ItalicAngle 0 /Ascent 928 /Descent -236 /CapHeight 730 /StemV 80 /FontFile2 ${file} 0 R >>`);
    const entries=Object.entries(font.metrics);
    const widths=entries.map(([,m])=>`${m[0]} [${m[1]}]`).join(' ');
    const cid=add(`<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${name} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${descriptor} 0 R /CIDToGIDMap /Identity /W [${widths}] >>`);
    let cmap='/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /QuizUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n';
    for(let i=0;i<entries.length;i+=100){const chunk=entries.slice(i,i+100);cmap+=chunk.length+' beginbfchar\n'+chunk.map(([code,m])=>`<${hex(m[0])}> <${hex(Number(code))}>`).join('\n')+'\nendbfchar\n'}
    cmap+='endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
    const unicode=add(`<< /Length ${cmap.length} >>\nstream\n${cmap}\nendstream`);
    return add(`<< /Type /Font /Subtype /Type0 /BaseFont /${name} /Encoding /Identity-H /DescendantFonts [${cid} 0 R] /ToUnicode ${unicode} 0 R >>`);
  }
  const regular=embedFont(QUIZ_PDF_FONTS.regular,'QuizSans'),bold=embedFont(QUIZ_PDF_FONTS.bold,'QuizSansBold');
  const pageIds=[];
  for(const cmds of pages){
    const pageId=objects.length+1,streamId=pageId+1;pageIds.push(pageId);
    const stream='0.08 0.14 0.2 rg\n'+cmds.join('\n')+'\n';
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> /Contents ${streamId} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  }
  objects[1]=`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id=>id+' 0 R').join(' ')}] >>`;
  let pdf='%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';const offsets=[0];
  objects.forEach((obj,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`});
  const start=pdf.length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return new Uint8Array(Array.from(pdf,c=>c.charCodeAt(0)));
}
