from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.error

API_KEY = "up_Z8l0qdJanerY1M84jECZ68rJ21gZi"

TONE_INSTRUCTIONS = {
    'polite': '매우 공손하고 예의 바르게, 존경을 표하는 말투로',
    'neutral': '적절히 예의 바르면서도 자연스럽고 친근한 말투로',
    'active': '적극적이고 자신감 있으며 프로페셔널한 말투로'
}

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            message = body.get('message', '')
            tone = body.get('tone', 'neutral')
            
            tone_desc = TONE_INSTRUCTIONS.get(tone, TONE_INSTRUCTIONS['neutral'])
            
            system_prompt = f"""당신은 MZ세대 직장인을 위한 카톡 답장 도우미입니다.
사용자가 받은 카톡 메시지를 분석하고, {tone_desc} 적절한 답장을 추천해 주세요.

답변 형식:
1. 먼저 받은 메시지의 상황과 상대방의 의도를 간단히 분석해 주세요.
2. 그 다음 추천 답장을 제시해 주세요.
3. 마지막으로 이 답장을 추천하는 이유나 팁을 짧게 설명해 주세요.

답변은 친근하면서도 실용적이어야 하며, 직장 내 관계를 고려해야 합니다."""

            request_body = json.dumps({
                "model": "solar-pro",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"다음 카톡 메시지에 대한 답장을 추천해 주세요:\n\n{message}"}
                ],
                "max_tokens": 1500,
                "temperature": 0.7
            }).encode('utf-8')
            
            req = urllib.request.Request(
                "https://api.upstage.ai/v1/chat/completions",
                data=request_body,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {API_KEY}"
                },
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=60) as response:
                result = json.loads(response.read().decode('utf-8'))
                reply = result['choices'][0]['message']['content']
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"reply": reply}).encode('utf-8'))
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.fp else str(e)
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"API 오류: {error_body}"}).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
