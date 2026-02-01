from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.error
import re

API_KEY = "up_Z8l0qdJanerY1M84jECZ68rJ21gZi"

TONE_INSTRUCTIONS = {
    'polite': '매우 공손하고 예의 바르게, 존경을 표하는 말투로',
    'neutral': '적절히 예의 바르면서도 자연스럽고 친근한 말투로',
    'active': '적극적이고 자신감 있으며 프로페셔널한 말투로'
}

def parse_multipart(content_type, body):
    """간단한 multipart/form-data 파서"""
    boundary = content_type.split('boundary=')[1].encode()
    parts = body.split(b'--' + boundary)
    
    result = {}
    
    for part in parts:
        if b'Content-Disposition' not in part:
            continue
            
        # 헤더와 바디 분리
        if b'\r\n\r\n' in part:
            header, content = part.split(b'\r\n\r\n', 1)
            content = content.rstrip(b'\r\n--')
            
            # name 추출
            header_str = header.decode('utf-8', errors='ignore')
            name_match = re.search(r'name="([^"]+)"', header_str)
            if name_match:
                name = name_match.group(1)
                
                # 파일인지 확인
                if b'filename=' in header:
                    result[name] = {
                        'data': content,
                        'is_file': True
                    }
                else:
                    result[name] = {
                        'data': content.decode('utf-8'),
                        'is_file': False
                    }
    
    return result

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_type = self.headers.get('Content-Type', '')
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            if 'multipart/form-data' not in content_type:
                raise ValueError("multipart/form-data 형식이 필요합니다")
            
            # multipart 파싱
            fields = parse_multipart(content_type, body)
            
            image_data = fields.get('image', {}).get('data')
            tone = fields.get('tone', {}).get('data', 'neutral')
            additional_text = fields.get('text', {}).get('data', '')
            
            if not image_data:
                raise ValueError("이미지를 찾을 수 없습니다")
            
            # OCR API 호출
            ocr_boundary = b'----FormBoundary7MA4YWxk'
            ocr_body = b'------FormBoundary7MA4YWxk\r\n'
            ocr_body += b'Content-Disposition: form-data; name="document"; filename="image.png"\r\n'
            ocr_body += b'Content-Type: image/png\r\n\r\n'
            ocr_body += image_data
            ocr_body += b'\r\n------FormBoundary7MA4YWxk\r\n'
            ocr_body += b'Content-Disposition: form-data; name="model"\r\n\r\n'
            ocr_body += b'ocr'
            ocr_body += b'\r\n------FormBoundary7MA4YWxk--\r\n'
            
            ocr_req = urllib.request.Request(
                "https://api.upstage.ai/v1/document-digitization",
                data=ocr_body,
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "multipart/form-data; boundary=----FormBoundary7MA4YWxk"
                },
                method="POST"
            )
            
            with urllib.request.urlopen(ocr_req, timeout=60) as ocr_response:
                ocr_result = json.loads(ocr_response.read().decode('utf-8'))
            
            # 텍스트 추출
            extracted_text = ocr_result.get('text', '') or ocr_result.get('content', '')
            if not extracted_text and 'pages' in ocr_result:
                extracted_text = '\n'.join([p.get('text', '') for p in ocr_result['pages']])
            
            if not extracted_text:
                extracted_text = '(이미지에서 텍스트를 추출하지 못했습니다)'
            
            # 답장 생성
            tone_desc = TONE_INSTRUCTIONS.get(tone, TONE_INSTRUCTIONS['neutral'])
            
            system_prompt = f"""당신은 MZ세대 직장인을 위한 카톡 답장 도우미입니다.
사용자가 업로드한 카톡 캡쳐 이미지에서 추출된 대화 내용을 분석하고, {tone_desc} 적절한 답장을 추천해 주세요.

답변 형식:
1. 먼저 추출된 대화 내용을 정리하고, 상황과 상대방의 의도를 분석해 주세요.
2. 그 다음 추천 답장을 제시해 주세요.
3. 마지막으로 이 답장을 추천하는 이유나 팁을 짧게 설명해 주세요.

답변은 친근하면서도 실용적이어야 하며, 직장 내 관계를 고려해야 합니다."""

            user_message = f"다음은 카톡 캡쳐에서 추출된 대화 내용입니다:\n\n{extracted_text}"
            if additional_text:
                user_message += f"\n\n추가 정보: {additional_text}"

            chat_body = json.dumps({
                "model": "solar-pro",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "max_tokens": 1500,
                "temperature": 0.7
            }).encode('utf-8')
            
            chat_req = urllib.request.Request(
                "https://api.upstage.ai/v1/chat/completions",
                data=chat_body,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {API_KEY}"
                },
                method="POST"
            )
            
            with urllib.request.urlopen(chat_req, timeout=60) as chat_response:
                chat_result = json.loads(chat_response.read().decode('utf-8'))
                reply = chat_result['choices'][0]['message']['content']
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "extracted_text": extracted_text,
                "reply": reply
            }, ensure_ascii=False).encode('utf-8'))
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.fp else str(e)
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"API 오류: {error_body}"}, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
