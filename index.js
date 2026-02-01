const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const UPSTAGE_API_KEY = process.env.UPSTAGE_API_KEY;

if (!UPSTAGE_API_KEY) {
    console.error('❌ UPSTAGE_API_KEY 환경변수를 설정해주세요.');
    console.error('   예: UPSTAGE_API_KEY=your_api_key node index.js');
    process.exit(1);
}

// HTML 템플릿
const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>카톡 답장 도우미 | Upstage Solar</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --upstage-primary: #7C6AFA;
            --upstage-secondary: #9D8FFF;
            --upstage-light: #C4BBFF;
            --upstage-dark: #5B4AD4;
            --upstage-bg: #F8F7FF;
            --chat-user: #7C6AFA;
            --chat-ai: #ffffff;
            --text-primary: #1a1a2e;
            --text-secondary: #6b6b8d;
            --shadow-soft: 0 4px 20px rgba(124, 106, 250, 0.15);
            --shadow-medium: 0 8px 32px rgba(124, 106, 250, 0.2);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Noto Sans KR', sans-serif;
            background: linear-gradient(135deg, #F8F7FF 0%, #EDE9FF 50%, #E0DBFF 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
        }

        /* 헤더 */
        .header {
            text-align: center;
            margin-bottom: 24px;
            animation: fadeInDown 0.6s ease-out;
        }

        .logo {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--upstage-primary) 0%, var(--upstage-dark) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }

        .subtitle {
            color: var(--text-secondary);
            font-size: 0.95rem;
            font-weight: 400;
        }

        /* 메인 컨테이너 */
        .container {
            width: 100%;
            max-width: 800px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            box-shadow: var(--shadow-medium);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: calc(100vh - 160px);
            min-height: 500px;
            animation: fadeInUp 0.6s ease-out 0.2s both;
        }

        /* 톤 선택 영역 */
        .tone-selector {
            padding: 16px 24px;
            background: linear-gradient(135deg, var(--upstage-primary) 0%, var(--upstage-dark) 100%);
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .tone-label {
            color: white;
            font-weight: 500;
            font-size: 0.9rem;
            margin-right: 8px;
        }

        .tone-btn {
            padding: 8px 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.3s ease;
            font-family: 'Noto Sans KR', sans-serif;
        }

        .tone-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
        }

        .tone-btn.active {
            background: white;
            color: var(--upstage-primary);
            border-color: white;
        }

        /* 채팅 영역 */
        .chat-area {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: var(--upstage-bg);
        }

        .message {
            max-width: 80%;
            animation: messageIn 0.3s ease-out;
        }

        .message.user {
            align-self: flex-end;
        }

        .message.ai {
            align-self: flex-start;
        }

        .message-bubble {
            padding: 14px 18px;
            border-radius: 18px;
            font-size: 0.95rem;
            line-height: 1.6;
            word-break: break-word;
        }

        .message.user .message-bubble {
            background: linear-gradient(135deg, var(--upstage-primary) 0%, var(--upstage-dark) 100%);
            color: white;
            border-bottom-right-radius: 4px;
        }

        .message.ai .message-bubble {
            background: white;
            color: var(--text-primary);
            border-bottom-left-radius: 4px;
            box-shadow: var(--shadow-soft);
        }

        .message-image {
            max-width: 100%;
            max-height: 300px;
            border-radius: 12px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: transform 0.3s ease;
        }

        .message-image:hover {
            transform: scale(1.02);
        }

        .message-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin-bottom: 4px;
            padding: 0 4px;
        }

        .message.user .message-label {
            text-align: right;
        }

        /* 웰컴 메시지 */
        .welcome-message {
            text-align: center;
            padding: 40px 20px;
            color: var(--text-secondary);
        }

        .welcome-icon {
            font-size: 3rem;
            margin-bottom: 16px;
        }

        .welcome-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .welcome-desc {
            font-size: 0.9rem;
            line-height: 1.6;
        }

        /* 입력 영역 */
        .input-area {
            padding: 20px 24px;
            background: white;
            border-top: 1px solid rgba(124, 106, 250, 0.1);
        }

        .image-preview-container {
            display: none;
            margin-bottom: 12px;
            position: relative;
            animation: fadeIn 0.3s ease;
        }

        .image-preview-container.active {
            display: block;
        }

        .image-preview {
            max-width: 200px;
            max-height: 150px;
            border-radius: 12px;
            border: 2px solid var(--upstage-light);
        }

        .remove-image {
            position: absolute;
            top: -8px;
            left: 192px;
            width: 24px;
            height: 24px;
            background: var(--upstage-primary);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .remove-image:hover {
            background: var(--upstage-dark);
            transform: scale(1.1);
        }

        .input-row {
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }

        .input-wrapper {
            flex: 1;
            position: relative;
        }

        .text-input {
            width: 100%;
            padding: 14px 18px;
            padding-right: 50px;
            border: 2px solid rgba(124, 106, 250, 0.2);
            border-radius: 16px;
            font-size: 0.95rem;
            font-family: 'Noto Sans KR', sans-serif;
            outline: none;
            transition: all 0.3s ease;
            resize: none;
            min-height: 52px;
            max-height: 150px;
        }

        .text-input:focus {
            border-color: var(--upstage-primary);
            box-shadow: 0 0 0 3px rgba(124, 106, 250, 0.1);
        }

        .text-input::placeholder {
            color: var(--text-secondary);
        }

        .attach-btn {
            position: absolute;
            right: 12px;
            bottom: 12px;
            width: 32px;
            height: 32px;
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-secondary);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .attach-btn:hover {
            color: var(--upstage-primary);
            transform: scale(1.1);
        }

        .send-btn {
            width: 52px;
            height: 52px;
            background: linear-gradient(135deg, var(--upstage-primary) 0%, var(--upstage-dark) 100%);
            color: white;
            border: none;
            border-radius: 16px;
            cursor: pointer;
            font-size: 1.2rem;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .send-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-medium);
        }

        .send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        /* 로딩 애니메이션 */
        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 12px 16px;
        }

        .typing-dot {
            width: 8px;
            height: 8px;
            background: var(--upstage-primary);
            border-radius: 50%;
            animation: typingBounce 1.4s infinite ease-in-out;
        }

        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }

        /* 히든 파일 인풋 */
        .file-input {
            display: none;
        }

        /* 힌트 텍스트 */
        .hint-text {
            text-align: center;
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-top: 8px;
        }

        /* 애니메이션 */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes messageIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes typingBounce {
            0%, 80%, 100% {
                transform: scale(0.6);
                opacity: 0.5;
            }
            40% {
                transform: scale(1);
                opacity: 1;
            }
        }

        /* 스크롤바 */
        .chat-area::-webkit-scrollbar {
            width: 6px;
        }

        .chat-area::-webkit-scrollbar-track {
            background: transparent;
        }

        .chat-area::-webkit-scrollbar-thumb {
            background: var(--upstage-light);
            border-radius: 3px;
        }

        /* 반응형 */
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }

            .container {
                height: calc(100vh - 120px);
                border-radius: 20px;
            }

            .logo {
                font-size: 1.5rem;
            }

            .tone-selector {
                padding: 12px 16px;
            }

            .tone-btn {
                padding: 6px 12px;
                font-size: 0.8rem;
            }

            .chat-area {
                padding: 16px;
            }

            .message {
                max-width: 90%;
            }

            .input-area {
                padding: 16px;
            }
        }

        /* 코드블록 스타일 */
        .code-block-wrapper {
            position: relative;
            margin: 12px 0 8px 0;
        }

        .code-block {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e8e8e8;
            padding: 16px;
            padding-top: 40px;
            border-radius: 12px;
            font-family: 'Noto Sans KR', monospace;
            font-size: 0.95rem;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
            overflow-x: auto;
        }

        .copy-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            padding: 6px 12px;
            background: var(--upstage-primary);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: 'Noto Sans KR', sans-serif;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .copy-btn:hover {
            background: var(--upstage-dark);
            transform: scale(1.05);
        }

        .copy-btn.copied {
            background: #10b981;
        }

        .copy-btn svg {
            width: 14px;
            height: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">💬 카톡 답장 도우미</div>
        <div class="subtitle">상사에게 보낼 완벽한 답장을 AI가 도와드립니다</div>
    </div>

    <div class="container">
        <div class="tone-selector">
            <span class="tone-label">답장 톤 선택:</span>
            <button class="tone-btn" data-tone="very-polite">🙇 매우 공손</button>
            <button class="tone-btn active" data-tone="neutral">😊 중립적</button>
            <button class="tone-btn" data-tone="active">💪 적극적</button>
        </div>

        <div class="chat-area" id="chatArea">
            <div class="welcome-message">
                <div class="welcome-icon">📱</div>
                <div class="welcome-title">카톡 캡쳐를 업로드하거나 대화 내용을 입력하세요</div>
                <div class="welcome-desc">
                    상사와의 카톡 내용을 분석하여<br>
                    상황에 맞는 답장 초안을 생성해 드립니다.
                </div>
            </div>
        </div>

        <div class="input-area">
            <div class="image-preview-container" id="imagePreviewContainer">
                <img src="" alt="미리보기" class="image-preview" id="imagePreview">
                <button class="remove-image" id="removeImage">×</button>
            </div>
            <div class="input-row">
                <div class="input-wrapper">
                    <textarea 
                        class="text-input" 
                        id="textInput" 
                        placeholder="대화 내용을 입력하거나, 이미지를 붙여넣기(Ctrl+V) 하세요..."
                        rows="1"
                    ></textarea>
                    <button class="attach-btn" id="attachBtn" title="이미지 첨부">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                        </svg>
                    </button>
                </div>
                <button class="send-btn" id="sendBtn" title="전송">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                </button>
            </div>
            <div class="hint-text">💡 Ctrl+V로 클립보드 이미지를 바로 붙여넣을 수 있습니다</div>
            <input type="file" class="file-input" id="fileInput" accept="image/*">
        </div>
    </div>

    <script>
        // 상태 관리
        let currentTone = 'neutral';
        let currentImage = null;
        let currentImageBase64 = null;
        let isLoading = false;
        let messages = [];

        // DOM 요소
        const chatArea = document.getElementById('chatArea');
        const textInput = document.getElementById('textInput');
        const sendBtn = document.getElementById('sendBtn');
        const attachBtn = document.getElementById('attachBtn');
        const fileInput = document.getElementById('fileInput');
        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        const imagePreview = document.getElementById('imagePreview');
        const removeImage = document.getElementById('removeImage');
        const toneBtns = document.querySelectorAll('.tone-btn');

        // 톤 설정
        const toneSettings = {
            'very-polite': {
                name: '매우 공손',
                systemPrompt: \`당신은 카톡 답장 도우미입니다. 매우 공손한 톤으로 답장을 작성합니다.

규칙:
1. 분석은 1-2문장으로 짧게
2. 답장 초안은 반드시 코드블록(\\\`\\\`\\\`)으로 감싸서 제공
3. 존칭과 높임말 철저히 사용
4. "~하겠습니다", "~드리겠습니다" 표현 사용

응답 형식:
📋 상황: (1문장 요약)

✉️ 추천 답장:
\\\`\\\`\\\`
(여기에 바로 복사해서 보낼 수 있는 답장)
\\\`\\\`\\\`\`
            },
            'neutral': {
                name: '중립적',
                systemPrompt: \`당신은 카톡 답장 도우미입니다. 자연스럽고 적절한 톤으로 답장을 작성합니다.

규칙:
1. 분석은 1-2문장으로 짧게
2. 답장 초안은 반드시 코드블록(\\\`\\\`\\\`)으로 감싸서 제공
3. 적절한 존칭, 너무 딱딱하지 않게
4. 명확하고 간결한 의사 전달

응답 형식:
📋 상황: (1문장 요약)

✉️ 추천 답장:
\\\`\\\`\\\`
(여기에 바로 복사해서 보낼 수 있는 답장)
\\\`\\\`\\\`\`
            },
            'active': {
                name: '적극적',
                systemPrompt: \`당신은 카톡 답장 도우미입니다. 적극적이고 자신감 있는 톤으로 답장을 작성합니다.

규칙:
1. 분석은 1-2문장으로 짧게
2. 답장 초안은 반드시 코드블록(\\\`\\\`\\\`)으로 감싸서 제공
3. 자신감 있고 주도적인 어조
4. 문제 해결 의지 표현

응답 형식:
📋 상황: (1문장 요약)

✉️ 추천 답장:
\\\`\\\`\\\`
(여기에 바로 복사해서 보낼 수 있는 답장)
\\\`\\\`\\\`\`
            }
        };

        // 톤 버튼 이벤트
        toneBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toneBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentTone = btn.dataset.tone;
            });
        });

        // 파일 첨부 버튼
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // 파일 선택 이벤트
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageFile(file);
            }
        });

        // 이미지 파일 처리
        function handleImageFile(file) {
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드 가능합니다.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                currentImage = file;
                currentImageBase64 = e.target.result;
                imagePreview.src = e.target.result;
                imagePreviewContainer.classList.add('active');
            };
            reader.readAsDataURL(file);
        }

        // 이미지 제거
        removeImage.addEventListener('click', () => {
            currentImage = null;
            currentImageBase64 = null;
            imagePreview.src = '';
            imagePreviewContainer.classList.remove('active');
            fileInput.value = '';
        });

        // 클립보드 붙여넣기
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData.items;
            for (let item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    handleImageFile(file);
                    break;
                }
            }
        });

        // 텍스트 입력창 자동 높이 조절
        textInput.addEventListener('input', () => {
            textInput.style.height = 'auto';
            textInput.style.height = Math.min(textInput.scrollHeight, 150) + 'px';
        });

        // Enter 키로 전송 (Shift+Enter는 줄바꿈)
        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // 전송 버튼
        sendBtn.addEventListener('click', sendMessage);

        // 메시지 전송
        async function sendMessage() {
            const text = textInput.value.trim();
            
            if (!text && !currentImage) {
                return;
            }

            if (isLoading) {
                return;
            }

            // 웰컴 메시지 제거
            const welcomeMsg = chatArea.querySelector('.welcome-message');
            if (welcomeMsg) {
                welcomeMsg.remove();
            }

            // 사용자 메시지 추가
            addUserMessage(text, currentImageBase64);

            // 입력 초기화
            const messageContent = text;
            const imageData = currentImageBase64;
            textInput.value = '';
            textInput.style.height = 'auto';
            currentImage = null;
            currentImageBase64 = null;
            imagePreview.src = '';
            imagePreviewContainer.classList.remove('active');
            fileInput.value = '';

            // 로딩 표시
            isLoading = true;
            sendBtn.disabled = true;
            const loadingMsg = addLoadingMessage(imageData ? '이미지 텍스트 추출 중...' : '답변 생성 중...');

            try {
                // API 호출
                const response = await callSolarAPI(messageContent, imageData);
                
                // 로딩 제거
                loadingMsg.remove();
                
                // AI 응답 추가
                addAIMessage(response);
            } catch (error) {
                loadingMsg.remove();
                addAIMessage('죄송합니다. 오류가 발생했습니다: ' + error.message);
            } finally {
                isLoading = false;
                sendBtn.disabled = false;
            }
        }

        // 사용자 메시지 추가
        function addUserMessage(text, imageBase64) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message user';
            
            let content = '';
            if (imageBase64) {
                content += \`<img src="\${imageBase64}" class="message-image" onclick="window.open(this.src)">\`;
            }
            if (text) {
                content += \`<div class="message-bubble">\${escapeHtml(text)}</div>\`;
            }
            
            messageDiv.innerHTML = \`
                <div class="message-label">나</div>
                \${content}
            \`;
            
            chatArea.appendChild(messageDiv);
            scrollToBottom();

            // 메시지 기록 저장
            messages.push({
                role: 'user',
                content: text,
                image: imageBase64
            });
        }

        // AI 메시지 추가
        function addAIMessage(text) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ai';
            messageDiv.innerHTML = \`
                <div class="message-label">AI 도우미</div>
                <div class="message-bubble">\${formatResponse(text)}</div>
            \`;
            
            chatArea.appendChild(messageDiv);
            scrollToBottom();

            // 메시지 기록 저장
            messages.push({
                role: 'assistant',
                content: text
            });
        }

        // 로딩 메시지 추가
        function addLoadingMessage(statusText = '답변 생성 중...') {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ai';
            messageDiv.innerHTML = \`
                <div class="message-label">AI 도우미</div>
                <div class="message-bubble">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px;">\${statusText}</div>
                </div>
            \`;
            
            chatArea.appendChild(messageDiv);
            scrollToBottom();
            return messageDiv;
        }

        // Solar API 호출
        async function callSolarAPI(userMessage, imageBase64) {
            const systemPrompt = toneSettings[currentTone].systemPrompt;
            
            // 메시지 구성
            let messageContent = userMessage || '이 카톡 대화 내용을 분석해서 적절한 답장을 추천해주세요.';
            
            // 이미지가 있으면 OCR로 텍스트 추출
            let ocrText = '';
            if (imageBase64) {
                try {
                    ocrText = await performOCR(imageBase64);
                    if (ocrText) {
                        messageContent = \`[카톡 캡쳐에서 추출한 대화 내용]
\${ocrText}

[사용자 요청]
\${userMessage || '위 대화 내용을 분석해서 적절한 답장을 추천해주세요.'}\`;
                    }
                } catch (error) {
                    console.error('OCR 실패:', error);
                    messageContent = '[이미지 텍스트 추출 실패]\\n\\n' + (userMessage || '이미지의 대화 내용을 직접 입력해주세요.');
                }
            }

            const apiMessages = [
                { role: 'system', content: systemPrompt }
            ];

            // 이전 대화 기록 추가 (최근 10개까지)
            const recentMessages = messages.slice(-10);
            for (const msg of recentMessages) {
                apiMessages.push({
                    role: msg.role,
                    content: msg.content
                });
            }

            // 현재 메시지 추가
            apiMessages.push({
                role: 'user',
                content: messageContent
            });

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: apiMessages
                })
            });

            if (!response.ok) {
                throw new Error('API 호출 실패');
            }

            const data = await response.json();
            return data.content;
        }

        // OCR 수행
        async function performOCR(imageBase64) {
            // base64에서 실제 이미지 데이터 추출
            const base64Data = imageBase64.split(',')[1];
            const mimeType = imageBase64.split(',')[0].match(/:(.*?);/)[1];
            
            // base64를 Blob으로 변환
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            
            // FormData 생성
            const formData = new FormData();
            formData.append('document', blob, 'image.png');
            formData.append('model', 'ocr');
            
            const response = await fetch('/api/ocr', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('OCR API 호출 실패');
            }
            
            const data = await response.json();
            
            // OCR 결과에서 텍스트 추출
            if (data.text) {
                return data.text;
            } else if (data.content && data.content.text) {
                return data.content.text;
            } else if (data.pages && data.pages.length > 0) {
                return data.pages.map(page => page.text || '').join('\\n');
            }
            
            return '';
        }

        // 응답 포맷팅
        function formatResponse(text) {
            // HTML 이스케이프
            let formatted = escapeHtml(text);
            
            // 코드블록 처리
            formatted = formatted.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, (match, code) => {
                const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
                const trimmedCode = code.trim();
                return \`<div class="code-block-wrapper">
                    <button class="copy-btn" onclick="copyCode('\${codeId}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>복사</span>
                    </button>
                    <div class="code-block" id="\${codeId}">\${trimmedCode}</div>
                </div>\`;
            });
            
            // 줄바꿈 처리
            formatted = formatted.replace(/\\n/g, '<br>');
            
            // 볼드 처리
            formatted = formatted.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
            
            return formatted;
        }

        // 코드 복사 함수
        function copyCode(codeId) {
            const codeBlock = document.getElementById(codeId);
            const text = codeBlock.innerText;
            
            navigator.clipboard.writeText(text).then(() => {
                const btn = codeBlock.parentElement.querySelector('.copy-btn');
                const originalText = btn.innerHTML;
                btn.classList.add('copied');
                btn.innerHTML = \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg><span>복사됨!</span>\`;
                
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = originalText;
                }, 2000);
            });
        }

        // HTML 이스케이프
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // 스크롤 하단으로
        function scrollToBottom() {
            chatArea.scrollTop = chatArea.scrollHeight;
        }
    </script>
</body>
</html>
`;

// 서버 생성
const server = http.createServer(async (req, res) => {
    // CORS 헤더
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 메인 페이지
    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
    }

    // OCR API 엔드포인트
    if (req.url === '/api/ocr' && req.method === 'POST') {
        let chunks = [];
        
        req.on('data', chunk => {
            chunks.push(chunk);
        });

        req.on('end', async () => {
            try {
                const body = Buffer.concat(chunks);
                const contentType = req.headers['content-type'];
                
                // multipart boundary 추출
                const boundaryMatch = contentType.match(/boundary=(.+)$/);
                if (!boundaryMatch) {
                    throw new Error('Invalid multipart data');
                }
                
                // 이미지 데이터를 Upstage OCR API로 전달
                const response = await fetch('https://api.upstage.ai/v1/document-digitization', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + UPSTAGE_API_KEY,
                        'Content-Type': contentType
                    },
                    body: body
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('OCR API Error:', errorText);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'OCR API 호출 실패', details: errorText }));
                    return;
                }

                const data = await response.json();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));

            } catch (error) {
                console.error('OCR Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    // Chat API 엔드포인트
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { messages } = JSON.parse(body);

                // Solar API 호출
                const response = await fetch('https://api.upstage.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + UPSTAGE_API_KEY
                    },
                    body: JSON.stringify({
                        model: 'solar-pro3',
                        messages: messages,
                        temperature: 0.8,
                        max_tokens: 2000
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Solar API Error:', errorText);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Solar API 호출 실패', details: errorText }));
                    return;
                }

                const data = await response.json();
                const content = data.choices[0]?.message?.content || '응답을 생성할 수 없습니다.';

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ content }));

            } catch (error) {
                console.error('Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║   💬 카톡 답장 도우미 서버가 시작되었습니다!               ║');
    console.log('║                                                            ║');
    console.log('║   🌐 브라우저에서 접속하세요:                              ║');
    console.log('║   👉 http://localhost:' + PORT + '                               ║');
    console.log('║                                                            ║');
    console.log('║   🛑 종료하려면 Ctrl+C를 누르세요                          ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
});
