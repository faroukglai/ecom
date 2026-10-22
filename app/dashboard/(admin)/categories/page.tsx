import { deleteCategory, saveCategory } from "@/app/actions/catalog";
import { requireAdmin } from "@/lib/auth";

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  const categories = data ?? [];
  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">Products / Category</div>
          <h1>Categories</h1>
        </div>
      </div>
      <div className="dash-grid dash-split">
        <section className="dash-card">
          <table className="dash-table">
            <thead><tr><th>Name</th><th>Slug</th><th>Visible</th><th></th></tr></thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>{category.visible ? "Yes" : "Hidden"}</td>
                  <td>
                    <form action={async () => { "use server"; await deleteCategory(category.id); }}>
                      <button className="dash-btn ghost" type="submit">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="dash-card">
          <h2 style={{fontSize:18,marginBottom:16}}>Add category</h2>
          <form action={saveCategory}>
            <label className="dash-field">Name<input name="name" required placeholder="Living room"/></label>
            <label className="dash-field">Slug<input name="slug" placeholder="living-room"/></label>
            <label className="dash-field">Parent category
              <select name="parent_id" defaultValue="">
                <option value="">None</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="dash-field">Description<textarea name="description"/></label>
            <label className="dash-field">Sort order<input name="sort_order" type="number" defaultValue={categories.length + 1}/></label>
            <label className="dash-check"><input type="checkbox" name="visible" defaultChecked/> Visible on storefront</label>
            <button className="dash-btn primary" type="submit" style={{marginTop:16}}>Save category</button>
          </form>
        </section>
      </div>
    </>
  );
}
