import { deleteCategory, saveCategory } from "@/app/actions/catalog";
import { DashActionForm } from "@/components/dashboard/action-form";
import { Icon } from "@/components/dashboard/icons";
import { DashPage } from "@/components/dashboard/runtime";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { requireAdmin } from "@/lib/auth";
import { fill } from "@/lib/dashboard-i18n";
import { getDashCopy } from "@/lib/dashboard-lang";

type Category = { id: string; name: string; slug: string; visible: boolean; parent_id: string | null };

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
  const [{ data }, { data: productRows }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products").select("category_id").limit(3000),
  ]);
  const categories = (data ?? []) as Category[];
  const perCategory = new Map<string, number>();
  for (const row of (productRows ?? []) as { category_id: string | null }[]) {
    if (row.category_id) perCategory.set(row.category_id, (perCategory.get(row.category_id) ?? 0) + 1);
  }
  const names = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <>
      <PageHeader title={t.categoriesTitle} subtitle={fill(t.categoryProducts, { n: productRows?.length ?? 0 })}/>
      <div className="dash-grid dash-split">
        <section className="dash-card flush">
          {categories.length ? (
            <div className="dash-table-wrap">
              <table className="dash-table stack">
                <thead><tr><th>{t.colName}</th><th>{t.colProduct}</th><th>{t.colVisible}</th><th className="end">{t.actions}</th></tr></thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="primary">
                        <div className="dash-cell">
                          <span className="dash-chip"><Icon name="layers" size={17}/></span>
                          <span>
                            <strong>{category.name}</strong>
                            <small><bdi className="dash-ltr">/{category.slug}</bdi>{category.parent_id && names.get(category.parent_id) ? ` · ${names.get(category.parent_id)}` : ""}</small>
                          </span>
                        </div>
                      </td>
                      <td data-label={t.colProduct}>{perCategory.get(category.id) ?? 0}</td>
                      <td data-label={t.colVisible}><span className={`dash-status ${category.visible ? "published" : "hidden"}`}>{category.visible ? t.yes : t.hidden}</span></td>
                      <td className="end actions">
                        <div className="dash-row-actions">
                          <DashActionForm
                            action={deleteCategory.bind(null, category.id)}
                            submitLabel={<Icon name="trash" size={15}/>}
                            submitTitle={t.delete}
                            submitClassName="dash-btn danger dash-btn-compact dash-btn-icon"
                            confirmMessage={t.deleteCategoryConfirm}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon="layers" title={t.categoriesTitle}/>}
        </section>
        <section className="dash-card">
          <div className="dash-card-head"><h2 className="dash-card-title"><Icon name="plus" size={17}/> {t.addCategory}</h2></div>
          <DashActionForm action={saveCategory} submitLabel={t.saveCategory} className="dash-category-form" resetOnSuccess>
            <label className="dash-field">{t.colName}<input name="name" required placeholder={t.namePlaceholder}/></label>
            <label className="dash-field">{t.colSlug}<input name="slug" dir="ltr" placeholder="living-room"/></label>
            <label className="dash-field">{t.parentCategory}
              <select name="parent_id" defaultValue="">
                <option value="">{t.none}</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="dash-field">{t.description}<textarea name="description"/></label>
            <label className="dash-field">{t.sortOrder}<input name="sort_order" type="number" defaultValue={categories.length + 1}/></label>
            <label className="dash-check"><input type="checkbox" name="visible" defaultChecked/> {t.visibleOnStore}</label>
          </DashActionForm>
        </section>
      </div>
    </>
  );
}
