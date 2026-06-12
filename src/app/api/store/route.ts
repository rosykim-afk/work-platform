import { NextRequest } from "next/server";

/**
 * 서버 인메모리 공유 스토어
 * 같은 Node.js 프로세스에서 실행되는 모든 요청이 이 객체를 공유한다.
 * → Chrome과 Claude 미리보기 브라우저가 같은 데이터를 읽고 쓴다.
 * (서버 재시작 시 초기화되지만 dev 환경에서는 무방)
 */
const sharedStore: Record<string, unknown[]> = {};

export async function GET() {
  return Response.json(sharedStore, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  Object.assign(sharedStore, body);
  return Response.json({ ok: true });
}

export async function DELETE() {
  for (const key of Object.keys(sharedStore)) {
    delete sharedStore[key];
  }
  return Response.json({ ok: true });
}
