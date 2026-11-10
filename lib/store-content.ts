import type { Category, Product } from "@/lib/types";
import type { Lang } from "@/lib/store-i18n";

/**
 * Temporary bilingual copy for the first 12 products and 9 categories.
 * Phase 2 moves this into the database (name_fr/name_ar, description_fr/description_ar) so the owner can edit it
 * in the dashboard; until then products without an entry here fall back to the name/description stored in the database.
 */
const productCopy: Record<string, { fr: [string, string]; ar: [string, string] }> = {
  "linen-cushion": {
    fr: ["Coussin en lin lavé", "Une touche de douceur qui change tout. Son lin lavé apporte une texture naturelle à votre canapé ou votre coin lecture. Housse amovible, facile à entretenir."],
    ar: ["وسادة من الكتان المغسول", "لمسة ناعمة تغيّر المكان. كتان مغسول بملمس طبيعي لأريكتك أو ركن القراءة. غطاء قابل للنزع وسهل التنظيف."],
  },
  "amber-vase": {
    fr: ["Vase en verre ambré soufflé à la main", "Sa teinte ambrée capte la lumière et réchauffe la pièce. Chaque vase est soufflé à la main : de légères variations rendent votre pièce unique."],
    ar: ["مزهرية زجاج كهرماني منفوخ يدوياً", "لونها الكهرماني يلتقط الضوء ويدفّئ المكان. كل مزهرية منفوخة يدوياً، لذلك تختلف قليلاً عن غيرها."],
  },
  "rattan-lamp": {
    fr: ["Lampe de table en chêne et rotin", "Une lumière douce pour vos soirées. L’abat-jour en rotin tressé et le pied en chêne apportent une chaleur naturelle à votre intérieur."],
    ar: ["مصباح طاولة من البلوط والروطان", "إضاءة هادئة لسهراتك. غطاء من الروطان المجدول وقاعدة من خشب البلوط يمنحان بيتك دفئاً طبيعياً."],
  },
  "stoneware-set": {
    fr: ["Service de table en grès", "Des pièces pensées pour les repas de tous les jours. Quatre assiettes et un bol de service en grès émaillé, faciles à utiliser et à nettoyer."],
    ar: ["طقم أطباق من الخزف", "قطع مناسبة لوجبات كل يوم. أربعة أطباق وصحن تقديم من الخزف المطلي، سهلة الاستعمال والتنظيف."],
  },
  "woven-basket": {
    fr: ["Panier de rangement en jonc de mer", "Une jolie place pour vos petits essentiels. Tressé en jonc de mer avec deux anses pratiques, il accueille plaids, livres ou plantes."],
    ar: ["سلة تخزين من ألياف البحر", "مكان جميل لأغراضك الصغيرة. مجدولة يدوياً بمقبضين عمليين، تتسع للأغطية والكتب والنباتات."],
  },
  "ceramic-candle": {
    fr: ["Bougie parfumée en céramique", "Une pause douceur en fin de journée. Des notes de figue, de cèdre et de lin dans un pot en céramique à réutiliser."],
    ar: ["شمعة معطّرة في وعاء خزفي", "استراحة هادئة في آخر اليوم. روائح التين والأرز والكتان في وعاء خزفي يمكن إعادة استعماله."],
  },
  "bedroom-cushion": {
    fr: ["Coussin de lit en lin", "La touche finale d’un lit accueillant : du lin respirant, un toucher doux et des finitions soignées."],
    ar: ["وسادة سرير من الكتان", "اللمسة الأخيرة لسرير مريح: كتان يسمح بالتهوية وملمس ناعم وخياطة متقنة."],
  },
  "bath-basket": {
    fr: ["Panier de rangement pour la salle de bain", "Rangez serviettes et essentiels du quotidien dans un panier tressé qui réchauffe la pièce."],
    ar: ["سلة تخزين للحمّام", "رتّب المناشف وأغراضك اليومية في سلة مجدولة تضفي دفئاً على الحمّام."],
  },
  "outdoor-vase": {
    fr: ["Vase ambré pour la terrasse", "Une belle table pour les longues journées. Ce vase en verre ambré accompagne vos repas sur une terrasse couverte."],
    ar: ["مزهرية كهرمانية للتراس", "طاولة جميلة لأيام طويلة. مزهرية من الزجاج الكهرماني ترافق وجباتك على التراس المغطى."],
  },
  "dinner-bundle": {
    fr: ["Grand service de table en grès", "De quoi recevoir tout le monde : huit assiettes et deux bols de service en grès, pour des repas à partager."],
    ar: ["طقم مائدة كبير من الخزف", "يكفي الجميع: ثمانية أطباق وصحنا تقديم من الخزف، لوجبات تجمع العائلة."],
  },
  "reading-lamp": {
    fr: ["Lampe de chevet en chêne et rotin", "Une lumière chaleureuse pour lire, ralentir et profiter d’un moment à soi."],
    ar: ["مصباح سرير من البلوط والروطان", "ضوء دافئ للقراءة والاسترخاء والاستمتاع بوقتك."],
  },
  "candle-duo": {
    fr: ["Duo de bougies parfumées", "Une à offrir, une à garder. Deux bougies à la figue et au cèdre dans des pots en céramique réutilisables."],
    ar: ["زوج شموع معطّرة", "واحدة للإهداء وواحدة لك. شمعتان بالتين والأرز في وعاءين خزفيين يمكن إعادة استعمالهما."],
  },
};

const categoryNames: Record<string, { fr: string; ar: string }> = {
  "living-room": { fr: "Salon", ar: "الصالون" },
  "kitchen-dining": { fr: "Cuisine et table", ar: "المطبخ والمائدة" },
  bedroom: { fr: "Chambre", ar: "غرفة النوم" },
  bath: { fr: "Salle de bain", ar: "الحمّام" },
  decor: { fr: "Décoration", ar: "الديكور" },
  lighting: { fr: "Luminaires", ar: "الإضاءة" },
  storage: { fr: "Rangement", ar: "التخزين" },
  "garden-outdoor": { fr: "Jardin et terrasse", ar: "الحديقة والتراس" },
  gifts: { fr: "Cadeaux", ar: "هدايا" },
};

export function productText(product: Pick<Product, "id" | "name" | "description">, lang: Lang) {
  const copy = productCopy[product.id]?.[lang];
  return { name: copy?.[0] ?? product.name, description: copy?.[1] ?? product.description };
}

export function categoryName(category: Pick<Category, "slug" | "name">, lang: Lang) {
  return categoryNames[category.slug]?.[lang] ?? category.name;
}

export function shortText(raw: string, max = 170) {
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 20).replace(/\s+\S*$/, "")}…`;
}
