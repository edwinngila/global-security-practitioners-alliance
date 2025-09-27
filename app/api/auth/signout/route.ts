import { NextResponse } from 'next/server'

export async function POST() {
  // With JWT stateless tokens, signout is handled client-side by deleting the token.
  // This endpoint exists for symmetry and potential future server-side session revocation.
  return NextResponse.json({ ok: true })
}
