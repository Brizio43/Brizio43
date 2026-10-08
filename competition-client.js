export const apiBase=()=>String(globalThis.QUIZ_CONFIG?.competitionApiUrl||'').replace(/\/$/,'');
export async function competitionRequest(path,{body,token,method}={}){
 const response=await fetch(apiBase()+'/api'+path,{method:method||(body?'POST':'GET'),headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
 const data=await response.json().catch(()=>null);
 if(!response.ok||!data)throw Error(data?.error||(response.status===404?'A competição precisa de um servidor ativo. Compartilhe o quiz por link para estudo individual ou abra o app na hospedagem com competição.':'Não foi possível acessar a competição. Tente novamente.'));
 return data;
}
