import { MedicinesDbModel } from "./storage";

const pakistaniMedicines = [
  // Antibiotics
  { name: "Amoxil 500mg Capsules", genericName: "Amoxicillin", category: "Antibiotics", manufacturer: "GSK Pakistan", type: "Capsule", description: "Broad-spectrum antibiotic for bacterial infections" },
  { name: "Augmentin 625mg Tablets", genericName: "Amoxicillin + Clavulanate", category: "Antibiotics", manufacturer: "GSK Pakistan", type: "Tablet", description: "Combined antibiotic for resistant bacterial infections" },
  { name: "Cifran 500mg Tablets", genericName: "Ciprofloxacin", category: "Antibiotics", manufacturer: "Ranbaxy", type: "Tablet", description: "Fluoroquinolone antibiotic for urinary tract and respiratory infections" },
  { name: "Flagyl 400mg Tablets", genericName: "Metronidazole", category: "Antibiotics", manufacturer: "Sanofi", type: "Tablet", description: "Antibiotic for anaerobic bacteria and parasites" },
  { name: "Zithromax 500mg Tablets", genericName: "Azithromycin", category: "Antibiotics", manufacturer: "Pfizer", type: "Tablet", description: "Macrolide antibiotic for respiratory and skin infections" },
  { name: "Klaricid 500mg Tablets", genericName: "Clarithromycin", category: "Antibiotics", manufacturer: "Abbott Pakistan", type: "Tablet", description: "Macrolide antibiotic for respiratory tract infections" },
  { name: "Cephalexin 500mg Capsules", genericName: "Cephalexin", category: "Antibiotics", manufacturer: "Various", type: "Capsule", description: "First-generation cephalosporin antibiotic" },
  { name: "Vibramycin 100mg Tablets", genericName: "Doxycycline", category: "Antibiotics", manufacturer: "Pfizer", type: "Tablet", description: "Tetracycline antibiotic for various infections" },
  { name: "Septran DS Tablets", genericName: "Trimethoprim + Sulfamethoxazole", category: "Antibiotics", manufacturer: "GSK Pakistan", type: "Tablet", description: "Combined antibiotic for UTI and respiratory infections" },
  { name: "Erythrocin 250mg Tablets", genericName: "Erythromycin", category: "Antibiotics", manufacturer: "Abbott Pakistan", type: "Tablet", description: "Macrolide antibiotic for skin and respiratory infections" },
  { name: "Meronem 500mg Injection", genericName: "Meropenem", category: "Antibiotics", manufacturer: "AstraZeneca", type: "Injection", description: "Carbapenem antibiotic for severe bacterial infections" },
  { name: "Tarivid 200mg Tablets", genericName: "Ofloxacin", category: "Antibiotics", manufacturer: "Sanofi", type: "Tablet", description: "Quinolone antibiotic for urinary tract infections" },

  // Analgesics & NSAIDs
  { name: "Panadol 500mg Tablets", genericName: "Paracetamol", category: "Analgesics", manufacturer: "GSK Pakistan", type: "Tablet", description: "Pain reliever and fever reducer" },
  { name: "Calpol 120mg/5ml Syrup", genericName: "Paracetamol", category: "Analgesics", manufacturer: "GSK Pakistan", type: "Syrup", description: "Children's paracetamol syrup for pain and fever" },
  { name: "Brufen 400mg Tablets", genericName: "Ibuprofen", category: "Analgesics", manufacturer: "Abbott Pakistan", type: "Tablet", description: "NSAID for pain, inflammation and fever" },
  { name: "Voltaren 50mg Tablets", genericName: "Diclofenac Sodium", category: "Analgesics", manufacturer: "Novartis", type: "Tablet", description: "NSAID for musculoskeletal pain and inflammation" },
  { name: "Aspirin 75mg Tablets", genericName: "Acetylsalicylic Acid", category: "Analgesics", manufacturer: "Bayer", type: "Tablet", description: "Low-dose aspirin for antiplatelet therapy" },
  { name: "Ponstan 500mg Capsules", genericName: "Mefenamic Acid", category: "Analgesics", manufacturer: "Pfizer", type: "Capsule", description: "NSAID for period pain and mild to moderate pain" },
  { name: "Tramal 50mg Capsules", genericName: "Tramadol", category: "Analgesics", manufacturer: "Grunenthal", type: "Capsule", description: "Opioid analgesic for moderate to severe pain" },
  { name: "Naproxen 500mg Tablets", genericName: "Naproxen", category: "Analgesics", manufacturer: "Various", type: "Tablet", description: "NSAID for arthritis and musculoskeletal pain" },
  { name: "Voltaren Gel 1%", genericName: "Diclofenac Diethylamine", category: "Analgesics", manufacturer: "Novartis", type: "Gel", description: "Topical NSAID gel for joint and muscle pain" },

  // Antihypertensives & Cardiac
  { name: "Norvasc 5mg Tablets", genericName: "Amlodipine", category: "Antihypertensives", manufacturer: "Pfizer", type: "Tablet", description: "Calcium channel blocker for hypertension and angina" },
  { name: "Renitec 5mg Tablets", genericName: "Enalapril", category: "Antihypertensives", manufacturer: "MSD Pakistan", type: "Tablet", description: "ACE inhibitor for hypertension and heart failure" },
  { name: "Cozaar 50mg Tablets", genericName: "Losartan", category: "Antihypertensives", manufacturer: "MSD Pakistan", type: "Tablet", description: "ARB for hypertension and kidney protection in diabetes" },
  { name: "Tenormin 50mg Tablets", genericName: "Atenolol", category: "Antihypertensives", manufacturer: "AstraZeneca", type: "Tablet", description: "Beta-blocker for hypertension and angina" },
  { name: "Diovan 80mg Tablets", genericName: "Valsartan", category: "Antihypertensives", manufacturer: "Novartis", type: "Tablet", description: "ARB for hypertension and heart failure" },
  { name: "Tritace 5mg Tablets", genericName: "Ramipril", category: "Antihypertensives", manufacturer: "Sanofi", type: "Tablet", description: "ACE inhibitor for hypertension and heart protection" },
  { name: "Concor 5mg Tablets", genericName: "Bisoprolol", category: "Antihypertensives", manufacturer: "Merck", type: "Tablet", description: "Selective beta-blocker for hypertension and heart failure" },
  { name: "Adalat 10mg Capsules", genericName: "Nifedipine", category: "Antihypertensives", manufacturer: "Bayer", type: "Capsule", description: "Calcium channel blocker for hypertension and angina" },
  { name: "Lasix 40mg Tablets", genericName: "Furosemide", category: "Antihypertensives", manufacturer: "Sanofi", type: "Tablet", description: "Loop diuretic for edema and hypertension" },
  { name: "Metolar 50mg Tablets", genericName: "Metoprolol", category: "Antihypertensives", manufacturer: "Sun Pharma", type: "Tablet", description: "Selective beta-1 blocker for hypertension" },
  { name: "Digoxin 0.25mg Tablets", genericName: "Digoxin", category: "Cardiac", manufacturer: "Various", type: "Tablet", description: "Cardiac glycoside for heart failure and arrhythmia" },
  { name: "Plavix 75mg Tablets", genericName: "Clopidogrel", category: "Cardiac", manufacturer: "Sanofi/BMS", type: "Tablet", description: "Antiplatelet therapy for cardiovascular protection" },

  // Diabetes
  { name: "Glucophage 500mg Tablets", genericName: "Metformin", category: "Diabetes", manufacturer: "Merck", type: "Tablet", description: "First-line treatment for type 2 diabetes" },
  { name: "Glucophage 1000mg Tablets", genericName: "Metformin", category: "Diabetes", manufacturer: "Merck", type: "Tablet", description: "Higher dose metformin for type 2 diabetes" },
  { name: "Daonil 5mg Tablets", genericName: "Glibenclamide", category: "Diabetes", manufacturer: "Sanofi", type: "Tablet", description: "Sulfonylurea for type 2 diabetes" },
  { name: "Amaryl 2mg Tablets", genericName: "Glimepiride", category: "Diabetes", manufacturer: "Sanofi", type: "Tablet", description: "Sulfonylurea for type 2 diabetes management" },
  { name: "Januvia 50mg Tablets", genericName: "Sitagliptin", category: "Diabetes", manufacturer: "MSD Pakistan", type: "Tablet", description: "DPP-4 inhibitor for type 2 diabetes" },
  { name: "Actos 15mg Tablets", genericName: "Pioglitazone", category: "Diabetes", manufacturer: "Various", type: "Tablet", description: "Thiazolidinedione for type 2 diabetes" },
  { name: "Actrapid 100IU/ml Injection", genericName: "Regular Insulin", category: "Diabetes", manufacturer: "Novo Nordisk", type: "Injection", description: "Short-acting insulin for diabetes management" },
  { name: "Insulatard 100IU/ml Injection", genericName: "Isophane Insulin", category: "Diabetes", manufacturer: "Novo Nordisk", type: "Injection", description: "Intermediate-acting insulin for diabetes" },

  // Antacids & GI
  { name: "Risek 20mg Capsules", genericName: "Omeprazole", category: "Antacids & GI", manufacturer: "Getz Pharma", type: "Capsule", description: "Proton pump inhibitor for acid reflux and ulcers" },
  { name: "Pantop 40mg Tablets", genericName: "Pantoprazole", category: "Antacids & GI", manufacturer: "Various", type: "Tablet", description: "Proton pump inhibitor for GERD and peptic ulcers" },
  { name: "Nexium 20mg Tablets", genericName: "Esomeprazole", category: "Antacids & GI", manufacturer: "AstraZeneca", type: "Tablet", description: "Proton pump inhibitor for acid-related disorders" },
  { name: "Gaviscon Liquid 150ml", genericName: "Sodium Alginate + Sodium Bicarbonate", category: "Antacids & GI", manufacturer: "Reckitt", type: "Syrup", description: "Antacid and alginate for heartburn and reflux" },
  { name: "Motilium 10mg Tablets", genericName: "Domperidone", category: "Antacids & GI", manufacturer: "Janssen", type: "Tablet", description: "Antiemetic and prokinetic for nausea and vomiting" },
  { name: "Maxolon 10mg Tablets", genericName: "Metoclopramide", category: "Antacids & GI", manufacturer: "Various", type: "Tablet", description: "Antiemetic for nausea and gastric stasis" },
  { name: "Imodium 2mg Capsules", genericName: "Loperamide", category: "Antacids & GI", manufacturer: "Janssen", type: "Capsule", description: "Antidiarrheal for acute and chronic diarrhea" },
  { name: "ORS Sachets", genericName: "Oral Rehydration Salts", category: "Antacids & GI", manufacturer: "Various", type: "Sachet", description: "Electrolyte replacement for dehydration due to diarrhea" },
  { name: "Zantac 150mg Tablets", genericName: "Ranitidine", category: "Antacids & GI", manufacturer: "GSK Pakistan", type: "Tablet", description: "H2 blocker for peptic ulcers and GERD" },

  // Antihistamines
  { name: "Zirtec 10mg Tablets", genericName: "Cetirizine", category: "Antihistamines", manufacturer: "UCB", type: "Tablet", description: "Non-drowsy antihistamine for allergic rhinitis and urticaria" },
  { name: "Clarityne 10mg Tablets", genericName: "Loratadine", category: "Antihistamines", manufacturer: "MSD Pakistan", type: "Tablet", description: "Non-sedating antihistamine for seasonal allergies" },
  { name: "Piriton 4mg Tablets", genericName: "Chlorphenamine Maleate", category: "Antihistamines", manufacturer: "GSK Pakistan", type: "Tablet", description: "Antihistamine for allergies and cold symptoms" },
  { name: "Telfast 120mg Tablets", genericName: "Fexofenadine", category: "Antihistamines", manufacturer: "Sanofi", type: "Tablet", description: "Non-sedating antihistamine for seasonal rhinitis" },
  { name: "Phenergan 25mg Tablets", genericName: "Promethazine", category: "Antihistamines", manufacturer: "Sanofi", type: "Tablet", description: "Antihistamine for allergies, nausea and motion sickness" },
  { name: "Atarax 25mg Tablets", genericName: "Hydroxyzine", category: "Antihistamines", manufacturer: "UCB", type: "Tablet", description: "Antihistamine and anxiolytic for anxiety and allergies" },

  // Respiratory
  { name: "Ventolin 100mcg Inhaler", genericName: "Salbutamol", category: "Respiratory", manufacturer: "GSK Pakistan", type: "Inhaler", description: "Short-acting bronchodilator for asthma and COPD" },
  { name: "Becotide 200mcg Inhaler", genericName: "Beclomethasone", category: "Respiratory", manufacturer: "GSK Pakistan", type: "Inhaler", description: "Corticosteroid inhaler for asthma prophylaxis" },
  { name: "Singulair 10mg Tablets", genericName: "Montelukast", category: "Respiratory", manufacturer: "MSD Pakistan", type: "Tablet", description: "Leukotriene antagonist for asthma and rhinitis" },
  { name: "Mucosolvan 30mg Tablets", genericName: "Ambroxol", category: "Respiratory", manufacturer: "Boehringer Ingelheim", type: "Tablet", description: "Mucolytic for productive cough and respiratory disorders" },
  { name: "Bisolvon 8mg Tablets", genericName: "Bromhexine", category: "Respiratory", manufacturer: "Boehringer Ingelheim", type: "Tablet", description: "Mucolytic agent for acute and chronic respiratory conditions" },
  { name: "Seretide 250 Inhaler", genericName: "Fluticasone + Salmeterol", category: "Respiratory", manufacturer: "GSK Pakistan", type: "Inhaler", description: "Combination inhaler for asthma maintenance therapy" },
  { name: "Atrovent Inhaler", genericName: "Ipratropium Bromide", category: "Respiratory", manufacturer: "Boehringer Ingelheim", type: "Inhaler", description: "Anticholinergic bronchodilator for COPD" },
  { name: "Theodur 200mg Tablets", genericName: "Theophylline", category: "Respiratory", manufacturer: "Various", type: "Tablet", description: "Bronchodilator for asthma and COPD" },

  // Vitamins & Supplements
  { name: "Vitamin C 500mg Tablets", genericName: "Ascorbic Acid", category: "Vitamins & Supplements", manufacturer: "Various", type: "Tablet", description: "Antioxidant vitamin for immune support and collagen synthesis" },
  { name: "Vitamin D3 1000IU Capsules", genericName: "Cholecalciferol", category: "Vitamins & Supplements", manufacturer: "Various", type: "Capsule", description: "Vitamin D supplement for bone health and immunity" },
  { name: "Neurobion Forte Tablets", genericName: "Vitamin B1+B6+B12", category: "Vitamins & Supplements", manufacturer: "Merck", type: "Tablet", description: "B-complex vitamins for neurological health" },
  { name: "Calcium Sandoz 500mg Tablets", genericName: "Calcium Carbonate + Vitamin D", category: "Vitamins & Supplements", manufacturer: "Sandoz", type: "Tablet", description: "Calcium supplement for bone health" },
  { name: "Ferrous Sulfate 200mg Tablets", genericName: "Iron Sulfate", category: "Vitamins & Supplements", manufacturer: "Various", type: "Tablet", description: "Iron supplement for iron deficiency anemia" },
  { name: "Folic Acid 5mg Tablets", genericName: "Folic Acid", category: "Vitamins & Supplements", manufacturer: "Various", type: "Tablet", description: "B vitamin for anemia prevention and pregnancy" },
  { name: "Zinc 20mg Tablets", genericName: "Zinc Sulfate", category: "Vitamins & Supplements", manufacturer: "Various", type: "Tablet", description: "Zinc supplement for immune function and wound healing" },
  { name: "Centrum Adults Tablets", genericName: "Multivitamins & Minerals", category: "Vitamins & Supplements", manufacturer: "Pfizer", type: "Tablet", description: "Complete daily multivitamin and mineral supplement" },
  { name: "Omega-3 1000mg Capsules", genericName: "Fish Oil / Omega-3", category: "Vitamins & Supplements", manufacturer: "Various", type: "Capsule", description: "Essential fatty acids for heart and brain health" },

  // Corticosteroids
  { name: "Deltacortril 5mg Tablets", genericName: "Prednisolone", category: "Corticosteroids", manufacturer: "Pfizer", type: "Tablet", description: "Corticosteroid for inflammatory and allergic conditions" },
  { name: "Dexamethasone 4mg Tablets", genericName: "Dexamethasone", category: "Corticosteroids", manufacturer: "Various", type: "Tablet", description: "Potent corticosteroid for severe inflammation and allergies" },
  { name: "Betnovate N Cream", genericName: "Betamethasone + Neomycin", category: "Corticosteroids", manufacturer: "GSK Pakistan", type: "Cream", description: "Topical steroid with antibiotic for skin conditions" },
  { name: "Hydrocortisone 1% Cream", genericName: "Hydrocortisone", category: "Corticosteroids", manufacturer: "Various", type: "Cream", description: "Mild topical corticosteroid for skin inflammation" },

  // Antifungals
  { name: "Diflucan 150mg Capsules", genericName: "Fluconazole", category: "Antifungals", manufacturer: "Pfizer", type: "Capsule", description: "Systemic antifungal for candidiasis and fungal infections" },
  { name: "Canesten 1% Cream", genericName: "Clotrimazole", category: "Antifungals", manufacturer: "Bayer", type: "Cream", description: "Topical antifungal for skin fungal infections" },
  { name: "Nizral 200mg Tablets", genericName: "Ketoconazole", category: "Antifungals", manufacturer: "Janssen", type: "Tablet", description: "Systemic antifungal for various fungal infections" },
  { name: "Lamisil 250mg Tablets", genericName: "Terbinafine", category: "Antifungals", manufacturer: "Novartis", type: "Tablet", description: "Antifungal for nail and skin fungal infections" },

  // CNS / Psychiatry
  { name: "Valium 5mg Tablets", genericName: "Diazepam", category: "CNS / Psychiatry", manufacturer: "Roche", type: "Tablet", description: "Benzodiazepine for anxiety, muscle spasm and seizures" },
  { name: "Xanax 0.5mg Tablets", genericName: "Alprazolam", category: "CNS / Psychiatry", manufacturer: "Pfizer", type: "Tablet", description: "Benzodiazepine for anxiety and panic disorder" },
  { name: "Lexapro 10mg Tablets", genericName: "Escitalopram", category: "CNS / Psychiatry", manufacturer: "Lundbeck", type: "Tablet", description: "SSRI antidepressant for depression and anxiety" },
  { name: "Sertraline 50mg Tablets", genericName: "Sertraline", category: "CNS / Psychiatry", manufacturer: "Pfizer", type: "Tablet", description: "SSRI antidepressant for depression, OCD and PTSD" },
  { name: "Risperidal 2mg Tablets", genericName: "Risperidone", category: "CNS / Psychiatry", manufacturer: "Janssen", type: "Tablet", description: "Atypical antipsychotic for schizophrenia and bipolar disorder" },

  // Thyroid
  { name: "Eltroxin 50mcg Tablets", genericName: "Levothyroxine Sodium", category: "Thyroid", manufacturer: "GSK Pakistan", type: "Tablet", description: "Thyroid hormone replacement for hypothyroidism" },
  { name: "Eltroxin 100mcg Tablets", genericName: "Levothyroxine Sodium", category: "Thyroid", manufacturer: "GSK Pakistan", type: "Tablet", description: "Higher dose thyroid hormone for hypothyroidism" },
  { name: "Neo-Mercazole 5mg Tablets", genericName: "Carbimazole", category: "Thyroid", manufacturer: "Various", type: "Tablet", description: "Antithyroid drug for hyperthyroidism" },

  // Cholesterol
  { name: "Lipitor 20mg Tablets", genericName: "Atorvastatin", category: "Cholesterol", manufacturer: "Pfizer", type: "Tablet", description: "Statin for high cholesterol and cardiovascular prevention" },
  { name: "Zocor 20mg Tablets", genericName: "Simvastatin", category: "Cholesterol", manufacturer: "MSD Pakistan", type: "Tablet", description: "Statin for hypercholesterolemia and CVD prevention" },
  { name: "Crestor 10mg Tablets", genericName: "Rosuvastatin", category: "Cholesterol", manufacturer: "AstraZeneca", type: "Tablet", description: "Potent statin for hypercholesterolemia" },

  // Anticoagulants
  { name: "Warfarin 5mg Tablets", genericName: "Warfarin Sodium", category: "Anticoagulants", manufacturer: "Various", type: "Tablet", description: "Anticoagulant for DVT and stroke prevention" },

  // Ophthalmic
  { name: "Maxidex Eye Drops", genericName: "Dexamethasone 0.1%", category: "Ophthalmic", manufacturer: "Alcon", type: "Eye Drops", description: "Corticosteroid eye drops for ocular inflammation" },
  { name: "Timoptol 0.5% Eye Drops", genericName: "Timolol", category: "Ophthalmic", manufacturer: "MSD Pakistan", type: "Eye Drops", description: "Beta-blocker eye drops for glaucoma" },
  { name: "Vigamox Eye Drops", genericName: "Moxifloxacin 0.5%", category: "Ophthalmic", manufacturer: "Alcon", type: "Eye Drops", description: "Antibiotic eye drops for bacterial conjunctivitis" },

  // Skin Care
  { name: "Fucidin Cream 15g", genericName: "Fusidic Acid", category: "Skin Care", manufacturer: "LEO Pharma", type: "Cream", description: "Antibiotic cream for skin bacterial infections" },
  { name: "Eumovate Cream 15g", genericName: "Clobetasone Butyrate", category: "Skin Care", manufacturer: "GSK Pakistan", type: "Cream", description: "Mild corticosteroid cream for eczema and dermatitis" },
  { name: "Dermovate Cream 25g", genericName: "Clobetasol Propionate", category: "Skin Care", manufacturer: "GSK Pakistan", type: "Cream", description: "Potent corticosteroid cream for severe skin conditions" },

  // Pain Injections
  { name: "Toradol 30mg Injection", genericName: "Ketorolac", category: "Analgesics", manufacturer: "Various", type: "Injection", description: "NSAID injection for moderate to severe pain" },
  { name: "Diclofenac 75mg Injection", genericName: "Diclofenac Sodium", category: "Analgesics", manufacturer: "Various", type: "Injection", description: "NSAID injection for acute pain" },
];

export async function seedMedicinesDb() {
  try {
    const count = await MedicinesDbModel.countDocuments();
    if (count === 0) {
      console.log("Seeding medicines_db...");
      await MedicinesDbModel.insertMany(pakistaniMedicines);
      console.log(`Seeded ${pakistaniMedicines.length} medicines into medicines_db.`);
    }
  } catch (err) {
    console.error("Error seeding medicines_db:", err);
  }
}
