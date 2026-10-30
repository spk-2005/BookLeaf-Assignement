import dotenv from 'dotenv';
import { getRelevantKnowledgeContext } from './kbService.js';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Heuristic Rule-Based Fallback Engine
 * Ensures 100% graceful degradation when external AI APIs are down, rate-limited, or keys unconfigured.
 */
function heuristicClassifyAndScore(subject = '', description = '') {
  const combined = `${subject} ${description}`.toLowerCase();

  // Category classification
  let category = 'General Inquiry';
  let categoryConfidence = 0.88;

  if (/royalt|pay|payout|earn|profit|money|threshold|45 days|quarter/i.test(combined)) {
    category = 'Royalty & Payments';
    categoryConfidence = 0.95;
  } else if (/isbn|barcode|imprint|wrong book|duplicate isbn/i.test(combined)) {
    category = 'ISBN & Metadata Issues';
    categoryConfidence = 0.97;
  } else if (/print|misprint|defect|blur|binding|page|copies|damage|paper/i.test(combined)) {
    category = 'Printing & Quality';
    categoryConfidence = 0.96;
  } else if (/amazon|flipkart|store|unavailable|stock|out of stock|retail|listing/i.test(combined)) {
    category = 'Distribution & Availability';
    categoryConfidence = 0.92;
  } else if (/typeset|proofread|cover design|manuscript|production|stage|timeline|progress/i.test(combined)) {
    category = 'Book Status & Production Updates';
    categoryConfidence = 0.94;
  }

  // Priority scoring based on business urgency
  let priority = 'Medium';
  let priorityReason = 'Standard inquiry regarding author catalog and services.';

  if (/no royalty|haven't received.*month|not paid|wrong isbn|duplicate isbn|legal/i.test(combined)) {
    priority = 'Critical';
    priorityReason = 'Overdue royalty payment (> 3 months) or ISBN catalog corruption requires immediate executive escalation.';
  } else if (/unavailable on amazon|terrible quality|defective|ruined|blurry|urgent|pending.*royalty/i.test(combined)) {
    priority = 'High';
    priorityReason = 'Physical print defect or retail availability sync issue directly impacting author sales.';
  } else if (/bio|profile|description update|general question|how does/i.test(combined)) {
    priority = 'Low';
    priorityReason = 'Routine non-urgent inquiry or metadata profile question.';
  }

  return { category, categoryConfidence, priority, priorityReason };
}

/**
 * High-fidelity fallback draft response generator strictly following BookLeaf Tone & Policies
 */
function generateFallbackDraft(authorName, subject, description, category, book = null) {
  const greeting = `Dear ${authorName || 'Author'},\n\n`;
  const signoff = `\n\nWarm regards,\nBookLeaf Author Operations & Support`;

  switch (category) {
    case 'Royalty & Payments':
      return (
        greeting +
        `Thank you for contacting us regarding your royalties${book ? ` for '${book.title}'` : ''}. We completely understand how vital transparent and timely payouts are to you.\n\n` +
        `As per BookLeaf's policy:\n` +
        `• Royalties are calculated on an 80/20 net profit split (Net Profit = MRP - Printing Cost - Platform Commission - Shipping).\n` +
        `• Payouts are calculated quarterly and distributed within 45 days following the quarter's close.\n` +
        `• The minimum payout threshold is ₹1,000 (amounts below this roll over to the subsequent quarter).\n\n` +
        (book && book.royalty_pending
          ? `Our records show your current pending balance is ₹${book.royalty_pending.toLocaleString('en-IN')}.\n`
          : '') +
        `Our finance team is currently reviewing your account to ensure your linked bank details are verified. If this payout is overdue, we will escalate this immediately and provide you with a resolution status within 48 hours.` +
        signoff
      );

    case 'ISBN & Metadata Issues':
      return (
        greeting +
        `Thank you for bringing this catalog discrepancy to our attention regarding ${book ? `'${book.title}'` : 'your book'}. We take ISBN and retail metadata integrity with the highest seriousness.\n\n` +
        `Every book published through BookLeaf receives an exclusive unique ISBN registered under our publisher imprint. We have flagged this ticket as High Priority and directly alerted our metadata & distribution desk.\n\n` +
        `We have requested an immediate catalog feed re-push with the retail platform (Amazon/Flipkart). Platform caches typically refresh within 24–48 hours, and we will update you with a verified confirmation within 48 hours.` +
        signoff
      );

    case 'Printing & Quality':
      return (
        greeting +
        `We sincerely apologize for the quality issue you experienced with your author copies. Authors are our creative partners, and receiving anything less than an immaculate physical book is unacceptable.\n\n` +
        `Under BookLeaf's Quality Guarantee, we arrange a 100% free reprint for verified misprints, binding defects, or margin misalignments.\n\n` +
        `Could you please reply with clear photographs showing the defect and the barcode/spine? Once received, our Delhi print operations team will schedule a replacement print run within 5–7 business days.` +
        signoff
      );

    case 'Distribution & Availability':
      return (
        greeting +
        `Thank you for checking in on the availability of ${book ? `'${book.title}'` : 'your title'}.\n\n` +
        `When a published book appears as 'Currently Unavailable' on Amazon or Flipkart, it usually indicates an automated platform stock synchronization delay rather than an actual inventory shortage.\n\n` +
        `Our distribution team has initiated a manual inventory re-sync across our distribution pipelines. Retail listings typically normalize within 24–48 hours. We are monitoring this listing and will confirm once live.` +
        signoff
      );

    case 'Book Status & Production Updates':
      return (
        greeting +
        `Thank you for inquiring about the production progress of ${book ? `'${book.title}'` : 'your manuscript'}.\n\n` +
        `At BookLeaf, each book progresses methodically through: Manuscript Received → Editing → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.\n\n` +
        (book ? `Your book is currently in the stage: '${book.status}'. ` : '') +
        `Our production coordinator is actively reviewing your manuscript files with our design team. We will send you an updated milestone timeline and proofs for your sign-off within 48 hours.` +
        signoff
      );

    default:
      return (
        greeting +
        `Thank you for reaching out to BookLeaf Publishing. We have received your query regarding "${subject}".\n\n` +
        `Our author support team is reviewing your account details and will provide a personalized update with clear next steps within 24 to 48 hours.\n\n` +
        `If you have any urgent attachments or details to add, please feel free to reply directly to this thread.` +
        signoff
      );
  }
}

/**
 * Call OpenAI GPT-4o-mini
 */
async function callOpenAI(messages, jsonMode = false) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2,
      response_format: jsonMode ? { type: 'json_object' } : undefined
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Google Gemini API
 */
async function callGemini(systemPrompt, userPrompt, jsonMode = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: jsonMode ? 'application/json' : 'text/plain'
      }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Step 1: Auto-Classify and Assign Priority
 */
export async function classifyAndScoreTicket({ subject, description, authorName, book }) {
  // Always prepare fallback as default
  const fallback = heuristicClassifyAndScore(subject, description);

  // If no external keys, return fallback immediately
  if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
    return { ...fallback, aiStatus: 'fallback' };
  }

  const systemPrompt = `You are the Lead Support AI at BookLeaf Publishing.
Classify incoming author queries into one of these exact categories:
1. "Royalty & Payments"
2. "ISBN & Metadata Issues"
3. "Printing & Quality"
4. "Distribution & Availability"
5. "Book Status & Production Updates"
6. "General Inquiry"

Assign Priority:
- "Critical": Missing royalty > 3 months, ISBN mismatch / duplicate ISBN causing retail errors.
- "High": Printing quality defects, book unavailable on Amazon/Flipkart, pending royalty inquiries.
- "Medium": Standard production progress questions, royalty breakdown queries.
- "Low": Author bio update, general website questions, minor inquiries.

Output ONLY valid JSON with keys:
{
  "category": "string",
  "category_confidence": number between 0.0 and 1.0,
  "priority": "Critical" | "High" | "Medium" | "Low",
  "priority_reason": "concise 1-sentence justification"
}`;

  const userPrompt = `Author: ${authorName || 'Author'}
Book: ${book ? `${book.title} (Status: ${book.status})` : 'General / Account Level'}
Subject: ${subject}
Description: ${description}`;

  try {
    let rawContent = '';
    if (OPENAI_API_KEY) {
      rawContent = await callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], true);
    } else if (GEMINI_API_KEY) {
      rawContent = await callGemini(systemPrompt, userPrompt, true);
    }

    const parsed = JSON.parse(rawContent);
    return {
      category: parsed.category || fallback.category,
      categoryConfidence: parsed.category_confidence || 0.95,
      priority: parsed.priority || fallback.priority,
      priorityReason: parsed.priority_reason || fallback.priorityReason,
      aiStatus: 'completed'
    };
  } catch (error) {
    console.warn('[AI Service] Classification API call failed, using graceful fallback:', error.message);
    return { ...fallback, aiStatus: 'fallback' };
  }
}

/**
 * Step 2: Generate Context-Grounded AI Draft Response for Admin
 */
export async function generateDraftResponse({ authorName, subject, description, category, book, adminCustomPrompt = null }) {
  // Retrieve token-optimized policy context
  const kbContext = getRelevantKnowledgeContext(subject, description, category, book);

  // Default fallback draft
  const fallbackDraft = generateFallbackDraft(authorName, subject, description, category, book);

  if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
    return { draft: fallbackDraft, aiStatus: 'fallback' };
  }

  const systemPrompt = `You are a professional, empathetic author support specialist at BookLeaf Publishing.
Your responses MUST adhere to BookLeaf's Communication Tone Guidelines:
- Treat the author as an esteemed partner, not a problem to manage.
- Acknowledge their concern genuinely with empathy before providing facts.
- Be concrete: cite actual BookLeaf numbers and policies (80/20 royalty split, quarterly cycle with 45-day payout, ₹1,000 threshold, 5-7 business day print turnaround, 24-48h stock sync).
- If something is an issue (ISBN error, delay), own it directly without corporate deflection.
- Give a specific 48-hour timeline when investigating or escalating.
- End with a clear next step.

RELEVANT BOOKLEAF KNOWLEDGE BASE POLICIES:
${JSON.stringify(kbContext.relevant_policies, null, 2)}

${kbContext.book_context ? `AUTHOR'S BOOK CONTEXT:\n${JSON.stringify(kbContext.book_context, null, 2)}` : ''}

Draft a complete, ready-to-send email response to the author. Do not use generic AI boilerplate. Sign off as 'BookLeaf Author Support Team'.`;

  const userPrompt = `Author Name: ${authorName || 'Author'}
Subject: ${subject}
Original Query: ${description}
Category: ${category}
${adminCustomPrompt ? `Additional Admin Guidance: ${adminCustomPrompt}` : ''}`;

  try {
    let draft = '';
    if (OPENAI_API_KEY) {
      draft = await callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], false);
    } else if (GEMINI_API_KEY) {
      draft = await callGemini(systemPrompt, userPrompt, false);
    }

    return { draft: draft.trim(), aiStatus: 'completed' };
  } catch (error) {
    console.warn('[AI Service] Draft generation API call failed, using graceful fallback:', error.message);
    return { draft: fallbackDraft, aiStatus: 'fallback' };
  }
}
