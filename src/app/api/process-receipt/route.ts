import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin (server-side)
if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const adminDb = getFirestore();

const SYSTEM_INSTRUCTION = `You are ClearAudit's automated finance compliance auditor.
Analyze the receipt image carefully. Extract all line items and verify against company spending policy:
- Maximum meal limit: $50.00 USD.
- Alcohol and tobacco purchases are strictly non-reimbursable.
- Weekend transactions must be flagged for secondary review.

Output MUST be strictly valid JSON matching this schema:
{
  "vendor_name": string,
  "date_of_purchase": "YYYY-MM-DD",
  "total_amount": number,
  "currency": string,
  "inferred_category": string,
  "line_items": [{"description": string, "amount": number}],
  "policy_violation": boolean,
  "violation_reason": string or null,
  "audit_confidence_score": number (0.0 to 1.0)
}

IMPORTANT: Return ONLY the JSON object, no markdown fencing, no extra text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, description, categoryHint, userId, amount } = body;

    if (!imageUrl || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, userId' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Initialize GenAI client
    const ai = new GoogleGenAI({ apiKey });

    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Call Gemma 4 model
    const response = await ai.models.generateContent({
      model: 'gemma-4-26b-a4b-it',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: contentType,
                data: base64Image,
              },
            },
            {
              text: `${SYSTEM_INSTRUCTION}\n\nAdditional context from user:\n- Category hint: ${categoryHint || 'None'}\n- Description: ${description || 'None'}\n- Manual amount provided: ${amount || 'None'}`,
            },
          ],
        },
      ],
    });

    // Extract text response
    const responseText = response.text || '';

    // Parse JSON from response (handle potential markdown fencing)
    let auditResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      auditResult = JSON.parse(jsonMatch[0]);
    } catch {
      // Fallback: create a basic result if AI parsing fails
      auditResult = {
        vendor_name: 'Unknown',
        date_of_purchase: new Date().toISOString().split('T')[0],
        total_amount: amount || 0,
        currency: 'USD',
        inferred_category: categoryHint || 'Other',
        line_items: [],
        policy_violation: false,
        violation_reason: null,
        audit_confidence_score: 0.3,
      };
    }

    // Override with manual amount if provided and AI couldn't extract
    if (amount && (!auditResult.total_amount || auditResult.total_amount === 0)) {
      auditResult.total_amount = amount;
    }

    // Write to Firestore
    const expenseDoc = {
      userId,
      imageUrl,
      userDescription: description || '',
      vendor_name: auditResult.vendor_name || 'Unknown',
      date_of_purchase: auditResult.date_of_purchase || new Date().toISOString().split('T')[0],
      total_amount: auditResult.total_amount || 0,
      currency: auditResult.currency || 'USD',
      inferred_category: auditResult.inferred_category || categoryHint || 'Other',
      line_items: auditResult.line_items || [],
      policy_violation: auditResult.policy_violation || false,
      violation_reason: auditResult.violation_reason || null,
      audit_confidence_score: auditResult.audit_confidence_score || 0,
      status: 'Pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('expenses').add(expenseDoc);

    return NextResponse.json({
      success: true,
      expenseId: docRef.id,
      auditResult,
    });
  } catch (error: unknown) {
    console.error('Process receipt error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
