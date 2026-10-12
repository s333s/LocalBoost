import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzePricing, type Product, type PricingSummary } from "@/lib/pricing";
import { generatePlan, type Plan } from "@/lib/localboost.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LocalBoost — Pricing & marketing help for local sellers" },
      { name: "description", content: "Enter your small business details and get honest pricing math, a 7-day content calendar and customer FAQ answers, in English or Arabic." },
      { property: "og:title", content: "LocalBoost — AI helper for local sellers" },
      { property: "og:description", content: "Honest pricing math, a 7-day social plan and FAQ answers for home-based businesses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Form = {
  businessType: string;
  targetCustomers: string;
  community: string;
  currency: string;
  fixedCosts: number;
  language: "en" | "ar";
  products: Product[];
};

// Sample businesses so the demo is fast.
const SAMPLES: Record<string, Form> = {
  "Home bakery": {
    businessType: "Home bakery selling cookies and cakes",
    targetCustomers: "Busy parents, office workers, birthday parties",
    community: "Muscat neighborhood",
    currency: "OMR", fixedCosts: 40, language: "en",
    products: [
      { name: "Box of 6 cookies", costPerItem: 1.2, price: 3 },
      { name: "Birthday cake", costPerItem: 6, price: 15 },
    ],
  },
  Tutor: {
    businessType: "High school math tutoring",
    targetCustomers: "Grade 9–12 students and their parents",
    community: "Local school district",
    currency: "USD", fixedCosts: 60, language: "en",
    products: [{ name: "1-hour session", costPerItem: 4, price: 30 }],
  },
  "Small shop": {
    businessType: "Small handmade accessories shop",
    targetCustomers: "Teens and young adults who like gifts",
    community: "Downtown market",
    currency: "USD", fixedCosts: 120, language: "ar",
    products: [
      { name: "Beaded bracelet", costPerItem: 2, price: 8 },
      { name: "Tote bag", costPerItem: 5, price: 14 },
    ],
  },
};

const EMPTY: Form = {
  businessType: "", targetCustomers: "", community: "", currency: "USD",
  fixedCosts: 0, language: "en", products: [{ name: "", costPerItem: 0, price: 0 }],
};

function Index() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [pricing, setPricing] = useState<PricingSummary | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const runPlan = useServerFn(generatePlan);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setProduct = (i: number, patch: Partial<Product>) =>
    set("products", form.products.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setPlan(null);
    const products = form.products.filter((p) => p.name.trim());
    if (!form.businessType.trim() || products.length === 0) {
      setError("Please add a business type and at least one product.");
      return;
    }
    // 1) Math in code
    const summary = analyzePricing(products, form.fixedCosts);
    setPricing(summary);
    // 2) AI explains it
    setLoading(true);
    try {
      const res = await runPlan({ data: {
        businessType: form.businessType, targetCustomers: form.targetCustomers,
        community: form.community, currency: form.currency, language: form.language, pricing: summary,
      } });
      if (res.ok) setPlan(res.plan); else setError(res.error);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  }

  const exportText = () => (pricing && plan ? toMarkdown(form, pricing, plan) : "");
  async function copyAll() {
    await navigator.clipboard.writeText(exportText());
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }
  function download() {
    const blob = new Blob([exportText()], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "localboost-plan.md"; a.click();
  }

  const dir = form.language === "ar" ? "rtl" : "ltr";
  const money = (n: number) => `${n.toFixed(2)} ${form.currency}`;

  return (
    <main className="min-h-screen">
      <header className="mx-auto max-w-5xl px-5 pt-12 pb-8">
        <p className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">For home & local sellers</p>
        <h1 className="mt-4 text-5xl font-extrabold leading-tight md:text-6xl">
          Local<span className="text-primary">Boost</span>
        </h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">
          Honest pricing math, a week of social posts and ready answers for your customers, in English or Arabic.
        </p>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-16">
        <form onSubmit={onSubmit} className="rounded-2xl border bg-card p-6 shadow-soft md:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Try a sample:</span>
            {Object.keys(SAMPLES).map((k) => (
              <button key={k} type="button" onClick={() => { setForm(SAMPLES[k]); setPlan(null); setPricing(null); }}
                className="rounded-full border border-border px-3 py-1 text-sm hover:bg-muted">{k}</button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business type" value={form.businessType} onChange={(v) => set("businessType", v)} placeholder="Home bakery" />
            <Field label="Community" value={form.community} onChange={(v) => set("community", v)} placeholder="My town or neighborhood" />
            <Field label="Target customers" value={form.targetCustomers} onChange={(v) => set("targetCustomers", v)} placeholder="Busy parents, students…" />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Currency" value={form.currency} onChange={(v) => set("currency", v)} />
              <Field label="Monthly fixed costs" type="number" value={String(form.fixedCosts)} onChange={(v) => set("fixedCosts", Number(v) || 0)} />
              <label className="text-sm font-medium">Output
                <select value={form.language} onChange={(e) => set("language", e.target.value as "en" | "ar")}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2">
                  <option value="en">English</option><option value="ar">العربية</option>
                </select>
              </label>
            </div>
          </div>

          <h3 className="mt-8 mb-3 text-xl font-semibold">Products</h3>
          <div className="space-y-3">
            {form.products.map((p, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] items-end gap-3">
                <Field label="Name" value={p.name} onChange={(v) => setProduct(i, { name: v })} />
                <Field label="Cost / item" type="number" value={String(p.costPerItem)} onChange={(v) => setProduct(i, { costPerItem: Number(v) || 0 })} />
                <Field label="Your price" type="number" value={String(p.price)} onChange={(v) => setProduct(i, { price: Number(v) || 0 })} />
                <button type="button" aria-label="Remove product" onClick={() => set("products", form.products.filter((_, j) => j !== i))}
                  className="mb-1 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set("products", [...form.products, { name: "", costPerItem: 0, price: 0 }])}
            className="mt-3 text-sm font-medium text-secondary hover:underline">+ Add product</button>

          <button type="submit" disabled={loading}
            className="mt-8 w-full rounded-xl bg-warm px-6 py-4 text-lg font-bold text-primary-foreground shadow-soft transition hover:opacity-95 disabled:opacity-60">
            {loading ? "Building your plan…" : "Boost my business"}
          </button>
          {error && <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        </form>

        {pricing && (
          <div className="mt-10 space-y-8" dir={dir}>
            <Card title={form.language === "ar" ? "تحليل الأسعار" : "Pricing analysis"} badge="Calculated in code">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground"><tr className="text-start">
                    <th className="py-2 text-start">Product</th><th className="text-start">Cost</th><th className="text-start">Price</th><th className="text-start">Profit</th><th className="text-start">Margin</th>
                  </tr></thead>
                  <tbody>{pricing.products.map((p) => (
                    <tr key={p.name} className="border-t">
                      <td className="py-2 font-medium">{p.name}</td><td>{money(p.costPerItem)}</td><td>{money(p.price)}</td>
                      <td className={p.profitPerItem < 0 ? "text-destructive" : ""}>{money(p.profitPerItem)}</td><td>{p.marginPercent}%</td>
                    </tr>))}</tbody>
                </table>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Stat label="Average profit per item" value={money(pricing.averageProfitPerItem)} />
                <Stat label="Break-even (items / month)" value={pricing.breakEvenUnits === null ? "Not reachable — price below cost" : String(pricing.breakEvenUnits)} />
              </div>
              {loading && <p className="mt-4 animate-pulse text-muted-foreground">AI is writing your explanation…</p>}
              {plan && (
                <div className="mt-5 rounded-xl bg-muted p-4">
                  <p className="font-semibold">Suggested price range: {money(plan.pricing.suggestedPriceRange.low)} – {money(plan.pricing.suggestedPriceRange.high)}</p>
                  <p className="mt-2 leading-relaxed">{plan.pricing.explanation}</p>
                  <ul className="mt-2 list-disc ps-5">{plan.pricing.tips.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
              )}
            </Card>

            {plan && (<>
              <Card title={form.language === "ar" ? "خطة المحتوى لمدة 7 أيام" : "7-day content calendar"}>
                <div className="grid gap-3 md:grid-cols-2">
                  {plan.calendar.map((d) => (
                    <div key={d.day} className="rounded-xl border p-4">
                      <div className="flex justify-between text-sm"><span className="font-bold text-primary">{d.day}</span><span className="text-muted-foreground">{d.platform}</span></div>
                      <p className="mt-1 font-semibold">{d.idea}</p>
                      <p className="mt-1 text-sm">{d.caption}</p>
                      <p className="mt-2 text-xs text-secondary">{d.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}</p>
                    </div>))}
                </div>
              </Card>
              <Card title={form.language === "ar" ? "أسئلة العملاء الشائعة" : "Top 5 customer questions"}>
                <div className="space-y-3">{plan.faqs.map((f) => (
                  <details key={f.question} className="rounded-xl border p-4" open>
                    <summary className="cursor-pointer font-semibold">{f.question}</summary>
                    <p className="mt-2 text-sm">{f.answer}</p>
                  </details>))}</div>
              </Card>
              <div className="flex flex-wrap gap-3" dir="ltr">
                <button onClick={copyAll} className="rounded-xl bg-secondary px-5 py-3 font-semibold text-secondary-foreground">{copied ? "Copied!" : "Copy all"}</button>
                <button onClick={download} className="rounded-xl border border-border px-5 py-3 font-semibold hover:bg-muted">Download (.md)</button>
              </div>
              <p className="text-xs text-muted-foreground" dir="ltr">AI suggestions are ideas, not guarantees. Numbers above are calculated from your inputs.</p>
            </>)}
          </div>
        )}
      </section>
    </main>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="text-sm font-medium">{props.label}
      <input type={props.type ?? "text"} step="any" min={props.type === "number" ? 0 : undefined} value={props.value}
        placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}

function Card({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        {badge && <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">{badge}</span>}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

// Turn the whole result into a Markdown text for copy/download.
function toMarkdown(f: Form, p: PricingSummary, plan: Plan) {
  const m = (n: number) => `${n.toFixed(2)} ${f.currency}`;
  return [
    `# LocalBoost plan — ${f.businessType}`, "", "## Pricing (calculated in code)",
    ...p.products.map((x) => `- ${x.name}: cost ${m(x.costPerItem)}, price ${m(x.price)}, profit ${m(x.profitPerItem)}, margin ${x.marginPercent}%`),
    `- Break-even: ${p.breakEvenUnits ?? "not reachable"} items/month`,
    `- Suggested range: ${m(plan.pricing.suggestedPriceRange.low)} – ${m(plan.pricing.suggestedPriceRange.high)}`,
    "", plan.pricing.explanation, ...plan.pricing.tips.map((t) => `- ${t}`),
    "", "## 7-day calendar",
    ...plan.calendar.map((d) => `### ${d.day} (${d.platform})\n${d.idea}\n\n${d.caption}\n${d.hashtags.join(" ")}\n`),
    "## Customer FAQs", ...plan.faqs.map((q) => `**${q.question}**\n${q.answer}\n`),
  ].join("\n");
}
