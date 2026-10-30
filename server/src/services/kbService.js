import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const kbPath = path.resolve(__dirname, '../data/knowledge_base.json');

const kbData = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));

/**
 * Intelligent context-retrieval (Mini-RAG / Topic Router)
 * Extracts only the relevant policy clauses for a given subject & description
 * to drastically minimize token consumption and improve model adherence.
 */
export function getRelevantKnowledgeContext(subject = '', description = '', category = null, book = null) {
  const text = `${subject} ${description} ${category || ''}`.toLowerCase();
  const selectedPolicies = [];

  // Always include core identity and tone guidelines
  const baseContext = {
    organization: "BookLeaf Publishing (India & US)",
    core_tone: kbData.tone_guidelines
  };

  // Topic matchers
  const isRoyalty = /royalt|pay|payout|earn|money|profit|statement|bank|transfer|quarter|threshold|rupee|₹|inr/i.test(text);
  const isIsbn = /isbn|barcode|imprint|metadata|title mismatch|edition/i.test(text);
  const isPrint = /print|copy|copies|defect|blur|margin|binding|page|misprint|paper|quality|cover finish/i.test(text);
  const isDistribution = /amazon|flipkart|store|unavailable|stock|out of stock|listing|live|buy|retail/i.test(text);
  const isProduction = /production|typeset|manuscript|proof|stage|progress|when will|delay|draft|design/i.test(text);

  if (isRoyalty || category === 'Royalty & Payments') {
    selectedPolicies.push({
      topic: "Royalty Policy",
      rules: kbData.royalty_policy
    });
  }

  if (isIsbn || category === 'ISBN & Metadata Issues') {
    selectedPolicies.push({
      topic: "ISBN & Catalog Policy",
      rules: kbData.isbn_policy
    });
  }

  if (isPrint || category === 'Printing & Quality') {
    selectedPolicies.push({
      topic: "Printing & Quality Policy",
      rules: kbData.printing_and_quality
    });
  }

  if (isDistribution || category === 'Distribution & Availability') {
    selectedPolicies.push({
      topic: "Distribution & Channel Policy",
      rules: kbData.distribution_and_availability
    });
  }

  if (isProduction || category === 'Book Status & Production Updates') {
    selectedPolicies.push({
      topic: "Production Stages & Turnaround",
      rules: kbData.production_stages
    });
  }

  // Fallback if no specific topic was triggered: include company overview
  if (selectedPolicies.length === 0) {
    selectedPolicies.push({
      topic: "General Company Overview & Policies",
      rules: kbData.company_overview
    });
  }

  return {
    ...baseContext,
    relevant_policies: selectedPolicies,
    book_context: book ? {
      title: book.title,
      isbn: book.isbn,
      status: book.status,
      mrp: book.mrp,
      royalty_per_copy: book.author_royalty_per_copy,
      total_sold: book.total_copies_sold,
      total_earned: book.total_royalty_earned,
      royalty_paid: book.royalty_paid,
      royalty_pending: book.royalty_pending,
      last_payout: book.last_royalty_payout_date,
      available_on: book.available_on
    } : null
  };
}

export function getAllCategories() {
  return kbData.categories;
}
