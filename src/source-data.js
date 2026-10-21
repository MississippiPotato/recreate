const cache=new Map();
const clean=text=>String(text).replace(/[\u200b-\u200f\ufeff]/g,'').trim();
export function loadSource(name){
  if(!cache.has(name))cache.set(name,(async()=>{
    const url=new URL('../assets/data/'+name,import.meta.url),response=await fetch(url);
    if(!response.ok)throw new Error(`${name}: HTTP ${response.status}`);
    const text=await response.text(),d3=window.d3;
    if(name==='terrain10.csv')return d3.csvParseRows(text).map(row=>row.map(Number));
    if(name==='crime1985.csv')return d3.csvParse(text).map((row,i)=>({id:'C'+i,name:clean(row['犯罪类型']),male:Number(row['男性']),female:Number(row['女性'])})).map(row=>({...row,total:row.male+row.female,ratio:(row.male-row.female)/(row.male+row.female)}));
    if(name==='original-students.csv')return d3.csvParse(text).map(row=>({id:row['序号'],name:row['姓名'],age:Number(row['年龄']),class:row['班级'],major:row['班级'].replace(/\d+班$/,''),gender:row['性别'],date:d3.utcParse('%Y-%m-%d')(row['生日'])}));
    return d3.csvParse(text,d3.autoType);
  })());
  return cache.get(name);
}
