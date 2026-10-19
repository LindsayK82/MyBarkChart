/* MyBarkChart — authenticated, pet-scoped Supabase medical data */
const MBCMedical = (() => {
  const db = myBarkChartSupabase;
  let contextPromise;
  async function context() {
    if (!contextPromise) contextPromise = (async () => {
      const {data:{user},error} = await db.auth.getUser();
      if(error || !user) { location.href='login.html'; throw new Error('Please log in to access medical records.'); }
      const active=localStorage.getItem('myBarkChartActivePetId');
      let query=db.from('pets').select('id,name,breed,date_of_birth,approximate_age,photo_url').eq('user_id',user.id);
      let pet=null;
      if(active && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(active)){ const r=await query.eq('id',active).maybeSingle(); if(r.error) throw r.error; pet=r.data; }
      if(!pet){const r=await db.from('pets').select('id,name,breed,date_of_birth,approximate_age,photo_url').eq('user_id',user.id).order('created_at',{ascending:true}).limit(1).maybeSingle();if(r.error)throw r.error;pet=r.data;}
      if(!pet)throw new Error('No pet found. Create a pet profile first.');
      localStorage.setItem('myBarkChartActivePetId',pet.id);
      return {user,pet};
    })().catch(e=>{contextPromise=null;throw e;});
    return contextPromise;
  }
  async function list(table){const {user,pet}=await context();const {data,error}=await db.from(table).select('*').eq('user_id',user.id).eq('pet_id',pet.id).order('created_at',{ascending:false});if(error)throw error;return data||[];}
  async function save(table,fields,id){const {user,pet}=await context();const values={...fields,user_id:user.id,pet_id:pet.id,updated_at:new Date().toISOString()};const query=id?db.from(table).update(values).eq('id',id).eq('user_id',user.id).eq('pet_id',pet.id):db.from(table).insert(values);const {data,error}=await query.select().single();if(error)throw error;return data;}
  async function clinics(select){const {user,pet}=await context();const {data,error}=await db.from('pet_clinics').select('id,name,veterinarian').eq('user_id',user.id).eq('pet_id',pet.id).order('is_primary',{ascending:false});if(error)throw error;const old=select.value;select.querySelectorAll('option:not([value=""]):not([value="Other / Not listed"])').forEach(n=>n.remove());for(const c of data||[]){const value=c.veterinarian||c.name;if(!value)continue;const opt=new Option(c.veterinarian&&c.name?`${c.veterinarian} — ${c.name}`:value,value);select.add(opt);}if(old)select.value=old;return data||[];}
  function error(e){console.error('MyBarkChart database error:',e);alert(`Could not save or load medical information: ${e.message||e}. Your changes have not been confirmed as saved.`);}
  return {context,list,save,clinics,error};
})();
