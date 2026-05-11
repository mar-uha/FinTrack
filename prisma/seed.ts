import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { CategoryType } from "../src/generated/prisma/enums";

type SeedCategory = {
  name: string;
  parentName: string;
  type: CategoryType;
};

const CATEGORIES: SeedCategory[] = [
  // Logement
  { parentName: "Logement", name: "Loyers, Charges", type: "RECURRENT" },
  { parentName: "Logement", name: "Energie (électricité, gaz, fuel, chauffage…)", type: "RECURRENT" },
  { parentName: "Logement", name: "Travaux, réparation, entretien, aménagement…", type: "VARIABLE" },

  // Abonnements & téléphonie
  { parentName: "Abonnements & téléphonie", name: "Multimedia à domicile (TV, internet, téléphonie…)", type: "RECURRENT" },
  { parentName: "Abonnements & téléphonie", name: "Téléphonie (fixe et mobile)", type: "RECURRENT" },

  // Auto & Moto
  { parentName: "Auto & Moto", name: "Assurances (Auto/Moto)", type: "RECURRENT" },
  { parentName: "Auto & Moto", name: "Carburant", type: "VARIABLE" },
  { parentName: "Auto & Moto", name: "Parking", type: "VARIABLE" },
  { parentName: "Auto & Moto", name: "Péages", type: "VARIABLE" },

  // Vie quotidienne
  { parentName: "Vie quotidienne", name: "Alimentation", type: "VARIABLE" },
  { parentName: "Vie quotidienne", name: "Animaux domestiques", type: "VARIABLE" },
  { parentName: "Vie quotidienne", name: "Bien-être et soins (coiffeur, parfums…)", type: "VARIABLE" },
  { parentName: "Vie quotidienne", name: "Bricolage et jardinage", type: "VARIABLE" },
  { parentName: "Vie quotidienne", name: "Equipements sportifs et artistiques", type: "VARIABLE" },
  { parentName: "Vie quotidienne", name: "Laverie, Pressing …", type: "VARIABLE" },
  { parentName: "Vie quotidienne", name: "Mobilier, électroménager, décoration…", type: "VARIABLE" },
  { parentName: "Vie quotidienne", name: "Vie Quotidienne - Autres", type: "VARIABLE" },

  // Loisirs et sorties
  { parentName: "Loisirs et sorties", name: "Divertissement - culture (ciné, théâtre, concerts…)", type: "VARIABLE" },
  { parentName: "Loisirs et sorties", name: "Loisirs - Autres", type: "VARIABLE" },
  { parentName: "Loisirs et sorties", name: "Restaurants, bars, discothèques…", type: "VARIABLE" },

  // Voyages & Transports
  { parentName: "Voyages & Transports", name: "Hébergement (hôtels, camping…)", type: "VARIABLE" },
  { parentName: "Voyages & Transports", name: "Transports longue distance (avions, trains…)", type: "VARIABLE" },
  { parentName: "Voyages & Transports", name: "Transports quotidiens (métro, bus…)", type: "VARIABLE" },
  { parentName: "Voyages & Transports", name: "Voyages & Transports - Autres", type: "VARIABLE" },

  // Santé
  { parentName: "Santé", name: "Pharmacie et laboratoire", type: "VARIABLE" },

  // Cadeaux et solidarité
  { parentName: "Cadeaux et solidarité", name: "Dons et Cadeaux", type: "VARIABLE" },

  // Mouvements internes
  { parentName: "Mouvements internes créditeurs", name: "Virements reçus de comptes à comptes", type: "VARIABLE" },
  { parentName: "Mouvements internes débiteurs", name: "Virements émis de comptes à comptes", type: "VARIABLE" },

  // Remboursements
  { parentName: "Remboursements", name: "Remboursements", type: "VARIABLE" },

  // Revenus
  { parentName: "Revenus d'épargne", name: "Revenus placement immobiliers", type: "VARIABLE" },

  // Non catégorisé
  { parentName: "Non catégorisé", name: "Non catégorisé", type: "VARIABLE" },
  { parentName: "Hors catégorie", name: "Hors catégorie", type: "VARIABLE" },
];

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const filename = url.startsWith("file:") ? url.slice("file:".length) : url;
  const adapter = new PrismaBetterSqlite3({ url: filename });
  const prisma = new PrismaClient({ adapter });

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { parentName: cat.parentName, type: cat.type },
      create: cat,
    });
  }

  console.log(`Seeded ${CATEGORIES.length} categories.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
