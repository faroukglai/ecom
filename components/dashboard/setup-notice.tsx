export function SetupNotice({ message }: { message?: string }) {
  return (
    <section className="dash-card" style={{borderColor:"#fcd34d",background:"#fffbeb"}}>
      <h2 style={{fontSize:18,marginBottom:8}}>Finish Supabase setup</h2>
      <p style={{color:"#6b7280",fontSize:14,lineHeight:1.6}}>
        {message ?? "Open the SQL editor for this project, paste supabase/schema.sql, and run it. That creates products, categories and orders, and confirms the admin login."}
      </p>
      <p style={{marginTop:12}}>
        <a className="dash-btn primary" href="https://supabase.com/dashboard/project/eocdleitnihglspprcsr/sql/new" target="_blank" rel="noreferrer">Open SQL editor</a>
      </p>
    </section>
  );
}
