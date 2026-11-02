import { readFileSync } from 'node:fs';
export const html=readFileSync(new URL('../../Moldable.dc.html',import.meta.url),'utf8');
// Execute the actual component logic. Replace only the import expression so its
// relative modules resolve from the HTML file under Node; no UI methods mocked.
const script=html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1].replace(/\bimport\(/g,'loadModule(');
export async function createUi() {
  const store=new Map();
  const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))};
  class DCLogic { constructor(props){this.props=props;} setState(p){this.state={...this.state,...p};} }
  const location={hash:'',href:'http://localhost/Moldable.dc.html'};
  const downloads=[];
  class DownloadURL extends URL {
    static createObjectURL(blob){downloads.push({blob});return 'blob:test';}
    static revokeObjectURL(){}
  }
  const document={body:{appendChild(){}},createElement:()=>({click(){downloads.at(-1).name=this.download;},remove(){}})};
  const localFetch=async url=>({ok:true,text:async()=>readFileSync(new URL('../../'+new URL(url).pathname.replace(/^\//,''),import.meta.url),'utf8')});
  const Component=new Function('DCLogic','window','localStorage','location','loadModule','document','URL','fetch',script+'\nreturn Component;')(
    DCLogic,{},storage,location,s=>import(new URL('../../'+s.replace(/^\.\//,''),import.meta.url)),document,DownloadURL,localFetch);
  const ui=new Component({});
  await ui._loadCad();
  // Toast timers are unrelated to these binding assertions.
  ui.showToast=message=>{ui.state.toast=message;};
  return {ui,store,downloads};
}
