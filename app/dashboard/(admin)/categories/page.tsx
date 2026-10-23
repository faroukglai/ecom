import { deleteCategory, saveCategory } from "@/app/actions/catalog";
import { DashPage } from "@/components/dashboard/runtime";
import { requireAdmin } from "@/lib/auth";
import { getDashCopy } from "@/lib/dashboard-lang";

export default function CategoriesPage() {
  return (
    <DashPage>
      <CategoriesBody/>
    </DashPage>
  );
}

async function CategoriesBody() {
  const { t } = await getDashCopy();
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  const categories = data ?? [];
  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">{t.categoriesCrumb}</div>
          <h1>{t.categoriesTitle}</h1>
        </div>
      </div>
      <div className="dash-grid dash-split">
        <section className="dash-card">
          <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>{t.colName}</th><th>{t.colSlug}</th><th>{t.colVisible}</th><th></th></tr></thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>{category.visible ? t.yes : t.hidden}</td>
                  <td>
                    <form action={async () => { "use server"; await deleteCategory(category.id); }}>
                      <button className="dash-btn ghost" type="submit">{t.delete}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
        <section className="dash-card">
          <h2 style={{fontSize:18,marginBottom:16}}>{t.addCategory}</h2>
          <form action={saveCategory}>
            <label className="dash-field">{t.colName}<input name="name" required placeholder={t.namePlaceholder}/></label>
            <label className="dash-field">{t.colSlug}<input name="slug" placeholder="living-room"/></label>
            <label className="dash-field">{t.parentCategory}
              <select name="parent_id" defaultValue="">
                <option value="">{t.none}</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="dash-field">{t.description}<textarea name="description"/></label>
            <label className="dash-field">{t.sortOrder}<input name="sort_order" type="number" defaultValue={categories.length + 1}/></label>
            <label className="dash-check"><input type="checkbox" name="visible" defaultChecked/> {t.visibleOnStore}</label>
            <button className="dash-btn primary" type="submit" style={{marginTop:16}}>{t.saveCategory}</button>
          </form>
        </section>
      </div>
    </>
  );
}
