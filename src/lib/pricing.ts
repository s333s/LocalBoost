// All money math lives here, in plain code. The AI never calculates numbers:
// it only explains the results we compute.

export type Product = {
  name: string;
  costPerItem: number; // what it costs you to make one item
  price: number; // what you plan to charge for one item
};

export type ProductPricing = Product & {
  profitPerItem: number; // price - cost
  marginPercent: number; // profit as a % of price
  markupPercent: number; // profit as a % of cost
};

export type PricingSummary = {
  products: ProductPricing[];
  monthlyFixedCosts: number;
  averageProfitPerItem: number;
  breakEvenUnits: number | null; // null when you lose money on every item
};

// Round to 2 decimals so numbers look tidy.
const round2 = (n: number) => Math.round(n * 100) / 100;

export function analyzeProduct(p: Product): ProductPricing {
  const profitPerItem = p.price - p.costPerItem;
  const marginPercent = p.price > 0 ? (profitPerItem / p.price) * 100 : 0;
  const markupPercent = p.costPerItem > 0 ? (profitPerItem / p.costPerItem) * 100 : 0;
  return {
    ...p,
    profitPerItem: round2(profitPerItem),
    marginPercent: round2(marginPercent),
    markupPercent: round2(markupPercent),
  };
}

// Break-even = how many items you must sell each month to cover fixed costs
// (packaging, ads, booth fees...). Formula: fixed costs / average profit per item.
export function analyzePricing(products: Product[], monthlyFixedCosts: number): PricingSummary {
  const analyzed = products.map(analyzeProduct);
  const avg =
    analyzed.length > 0
      ? analyzed.reduce((sum, p) => sum + p.profitPerItem, 0) / analyzed.length
      : 0;
  const breakEvenUnits = avg > 0 ? Math.ceil(monthlyFixedCosts / avg) : null;
  return {
    products: analyzed,
    monthlyFixedCosts,
    averageProfitPerItem: round2(avg),
    breakEvenUnits,
  };
}
