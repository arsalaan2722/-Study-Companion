/* ==========================================================================
   STUDY COMPANION - ENHANCED CLIENT SCRIPT (INTERACTIVE UX & DEPLOY READY)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let currentApiKey = localStorage.getItem('groq_api_key') || '';
    let isDarkMode = localStorage.getItem('study_companion_theme') === 'dark';
    let currentFileText = '';
    let currentFileName = '';
    let generatedResults = null;
    let history = JSON.parse(localStorage.getItem('study_companion_history') || '[]');
    
    // Flashcards State
    let flashcardsDeck = [];
    let currentCardIndex = 0;
    // Speech Synth State
    let isSpeaking = false;
    let synth = window.speechSynthesis;
    let currentUtterance = null;
    // --- DOM Elements ---
    const htmlElem = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const navButtons = document.querySelectorAll('.nav-item button');
    const tabPages = document.querySelectorAll('.tab-page');
    const pageTitleDisplay = document.getElementById('pageTitleDisplay');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    // Input Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const filePreviewBadge = document.getElementById('filePreviewBadge');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const btnRemoveFile = document.getElementById('btnRemoveFile');
    const manualTextArea = document.getElementById('manualTextArea');
    const wordCountBadge = document.getElementById('wordCountBadge');
    const samplePills = document.querySelectorAll('.sample-pill');
    // Option Elements
    const checkSummary = document.getElementById('checkSummary');
    const checkDetailed = document.getElementById('checkDetailed');
    const checkKeywords = document.getElementById('checkKeywords');
    const selectStyle = document.getElementById('selectStyle');
    const btnGenerate = document.getElementById('btnGenerate');
    const btnSpinner = document.getElementById('btnSpinner');
    // Progress Elements
    const progressContainer = document.getElementById('progressContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressStatusText = document.getElementById('progressStatusText');
    // Output Elements
    const placeholderState = document.getElementById('placeholderState');
    const outputContent = document.getElementById('outputContent');
    const reportTitle = document.getElementById('reportTitle');
    const summaryBox = document.getElementById('summaryBox');
    const summaryText = document.getElementById('summaryText');
    const detailedNotesContainer = document.getElementById('detailedNotesContainer');
    const detailedNotesContent = document.getElementById('detailedNotesContent');
    const keyPointsContainer = document.getElementById('keyPointsContainer');
    const keyPointsContent = document.getElementById('keyPointsContent');
    // Interactive Tools Elements
    const btnAudioReader = document.getElementById('btnAudioReader');
    const btnToggleFlashcards = document.getElementById('btnToggleFlashcards');
    const btnToggleSearch = document.getElementById('btnToggleSearch');
    const searchNotesBar = document.getElementById('searchNotesBar');
    const searchNotesInput = document.getElementById('searchNotesInput');
    // Flashcards DOM
    const flashcardsContainer = document.getElementById('flashcardsContainer');
    const flashcardElem = document.getElementById('flashcardElem');
    const flashcardFront = document.getElementById('flashcardFront');
    const flashcardBack = document.getElementById('flashcardBack');
    const cardCounter = document.getElementById('cardCounter');
    const btnPrevCard = document.getElementById('btnPrevCard');
    const btnNextCard = document.getElementById('btnNextCard');
    // Export Elements
    const btnExportPdf = document.getElementById('btnExportPdf');
    const btnExportPpt = document.getElementById('btnExportPpt');
    const btnCopyTxt = document.getElementById('btnCopyTxt');
    const btnDownloadTxt = document.getElementById('btnDownloadTxt');
    // API Modal Elements
    const apiStatusBadge = document.getElementById('apiStatusBadge');
    const apiModal = document.getElementById('apiModal');
    const btnOpenApiModal = document.getElementById('btnOpenApiModal');
    const btnCloseApiModal = document.getElementById('btnCloseApiModal');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const btnSaveApiKey = document.getElementById('btnSaveApiKey');
    // History Container
    const historyList = document.getElementById('historyList');
    // --- Mobile Menu Drawer ---
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
    // --- Theme Setup ---
    function applyTheme(dark) {
        isDarkMode = dark;
        if (dark) {
            htmlElem.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
            localStorage.setItem('study_companion_theme', 'dark');
        } else {
            htmlElem.removeAttribute('data-theme');
            themeToggle.checked = false;
            localStorage.setItem('study_companion_theme', 'light');
        }
    }
    applyTheme(isDarkMode);
    themeToggle.addEventListener('change', (e) => {
        applyTheme(e.target.checked);
    });
    // --- API Status Update ---
    function updateApiBadge() {
        if (currentApiKey && currentApiKey.trim().length > 0) {
            apiStatusBadge.classList.remove('demo-mode');
            apiStatusBadge.querySelector('.status-text').textContent = 'Groq API Active';
        } else {
            apiStatusBadge.classList.add('demo-mode');
            apiStatusBadge.querySelector('.status-text').textContent = 'Demo Mode Active';
        }
    }
    updateApiBadge();
    // --- Word Count & Reading Time Estimator ---
    function updateWordCount() {
        const text = (manualTextArea.value || currentFileText || '').trim();
        if (!text) {
            wordCountBadge.textContent = '0 words • 0 min read';
            return;
        }
        const words = text.split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(words / 200));
        wordCountBadge.textContent = `${words} words • ~${readTime} min read`;
    }
    manualTextArea.addEventListener('input', updateWordCount);
    // --- Sample Topic Pills Loader ---
    const sampleTopics = {
        'physics': `Quantum Mechanics explores the fundamental behavior of matter and light on atomic and subatomic scales. Unlike classical mechanics, quantum mechanics introduces wave-particle duality, where photons and electrons exhibit characteristics of both particles and waves. Key principles include Heisenberg's Uncertainty Principle—stating that position and momentum cannot be simultaneously measured with arbitrary precision—and Erwin Schrödinger's wave equation governing quantum state evolution. Practical applications include quantum computing, semiconductor electronics, lasers, and magnetic resonance imaging (MRI).`,
        'cs': `Object-Oriented Programming (OOP) is a software design paradigm structured around objects containing data fields and methods. The four core pillars of OOP are Encapsulation (bundling data with methods and restricting direct access), Abstraction (hiding implementation complexity behind clear interfaces), Inheritance (enabling child classes to reuse parent behaviors), and Polymorphism (allowing distinct objects to respond to identical method calls in specialized ways). Languages like Java, Python, C++, and C# rely heavily on OOP for building scalable enterprise applications.`,
        'biology': `Photosynthesis is the bio-chemical process by which green plants, algae, and cyanobacteria convert light energy from the sun into chemical energy stored in glucose molecules. Taking place within the chloroplasts, the reaction combines carbon dioxide and water to produce glucose and oxygen gas as a byproduct. The process is divided into Light-Dependent Reactions (producing ATP and NADPH in the thylakoid membrane) and the Calvin Cycle (fixing carbon into carbohydrates within the stroma). Photosynthesis provides the primary energy base for virtually all biological food webs on Earth.`
    };
    samplePills.forEach(pill => {
        pill.addEventListener('click', () => {
            const topicKey = pill.getAttribute('data-sample');
            if (sampleTopics[topicKey]) {
                manualTextArea.value = sampleTopics[topicKey];
                updateWordCount();
                showToast(`Loaded ${pill.textContent.trim()} sample material!`);
            }
        });
    });
    // --- Navigation Tabs ---
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            navButtons.forEach(b => b.parentElement.classList.remove('active'));
            btn.parentElement.classList.add('active');
            tabPages.forEach(page => {
                if (page.id === `tab-${targetTab}`) {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
            const tabNames = {
                'home': 'Study Workspace',
                'features': 'App Features',
                'history': 'Note Generation History',
                'about': 'About Study Companion'
            };
            pageTitleDisplay.textContent = tabNames[targetTab] || 'Workspace';
            if (targetTab === 'history') {
                renderHistory();
            }
        });
    });
    // --- File Dropzone Logic ---
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation();
        currentFileText = '';
        currentFileName = '';
        fileInput.value = '';
        filePreviewBadge.style.display = 'none';
        dropzone.style.display = 'block';
        updateWordCount();
    });
    function handleFileSelect(file) {
        currentFileName = file.name;
        const ext = file.name.split('.').pop().toLowerCase();
        showToast(`Processing file: ${file.name}`);
        if (ext === 'txt') {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentFileText = e.target.result;
                showFilePreview(file.name);
                updateWordCount();
            };
            reader.readAsText(file);
        } else if (ext === 'pdf') {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const typedarray = new Uint8Array(e.target.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n\n';
                    }
                    currentFileText = fullText;
                    showFilePreview(file.name);
                    updateWordCount();
                } catch (err) {
                    showToast('Failed to parse PDF file.', 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (ext === 'docx') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(result => {
                        currentFileText = result.value;
                        showFilePreview(file.name);
                        updateWordCount();
                    })
                    .catch(err => {
                        showToast('Failed to parse DOCX file.', 'error');
                    });
            };
            reader.readAsArrayBuffer(file);
        } else {
            showToast('Unsupported file type. Please upload PDF, DOCX, or TXT.', 'error');
        }
    }
    function showFilePreview(filename) {
        fileNameDisplay.textContent = filename;
        dropzone.style.display = 'none';
        filePreviewBadge.style.display = 'flex';
    }
    // --- Toast Notifications ---
    function showToast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast';
        if (type === 'error') toast.style.backgroundColor = '#ef4444';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3500);
    }
    // --- API & Demo Generator Logic with Progress Animation ---
    btnGenerate.addEventListener('click', async () => {
        const textInput = manualTextArea.value.trim() || currentFileText.trim();
        if (!textInput) {
            showToast('Please upload a document or paste text to generate notes.', 'error');
            return;
        }
        const wantsSummary = checkSummary.checked;
        const wantsDetailed = checkDetailed.checked;
        const wantsKeywords = checkKeywords.checked;
        const noteStyle = selectStyle.value;
        if (!wantsSummary && !wantsDetailed && !wantsKeywords) {
            showToast('Please select at least one component to generate.', 'error');
            return;
        }
        setLoading(true);
        startProgressAnimation();
        try {
            let result = {
                topic: textInput.slice(0, 60).replace(/\n/g, ' '),
                date: new Date().toLocaleDateString(),
                summary: '',
                notes: '',
                key_points: ''
            };
            if (currentApiKey && currentApiKey.trim().length > 0) {
                // Live Groq API Call
                updateProgress(30, 'Connecting to Groq LLaMA 3.3 70B...');
                if (wantsSummary) {
                    result.summary = await callGroqApi(
                        "You are an expert tutor creating concise summaries.",
                        `Summarize the following content in 3-5 concise, high-impact sentences:\n\nContent: ${textInput}`
                    );
                }
                updateProgress(65, 'Structuring study notes & headings...');
                if (wantsDetailed) {
                    result.notes = await callGroqApi(
                        "You are an expert tutor creating structured study notes.",
                        `Convert the following content into structured study notes with headings (##, ###), subheadings, bullet points, and key takeaways in a ${noteStyle} style:\n\nContent: ${textInput}`
                    );
                }
                updateProgress(85, 'Extracting key concepts & keywords...');
                if (wantsKeywords) {
                    result.key_points = await callGroqApi(
                        "You are an expert tutor extracting key concepts.",
                        `Extract the most critical key points and keywords from this content as a clean bulleted markdown list:\n\nContent: ${textInput}`
                    );
                }
            } else {
                // Smart Simulated Demo Generator
                updateProgress(35, 'Analyzing source text & extracting concepts...');
                await new Promise(r => setTimeout(r, 400));
                updateProgress(70, 'Building structured notes & summary...');
                await new Promise(r => setTimeout(r, 400));
                result = generateDemoNotes(textInput, wantsSummary, wantsDetailed, wantsKeywords, noteStyle);
            }
            updateProgress(100, 'Notes ready!');
            await new Promise(r => setTimeout(r, 200));
            generatedResults = result;
            // Save to History
            history.unshift(result);
            if (history.length > 20) history.pop();
            localStorage.setItem('study_companion_history', JSON.stringify(history));
            renderOutput(result);
            buildFlashcards(result);
            showToast('Notes generated successfully!');
        } catch (err) {
            showToast(`Generation Error: ${err.message}`, 'error');
        } finally {
            setLoading(false);
            stopProgressAnimation();
        }
    });
    function setLoading(isLoading) {
        btnGenerate.disabled = isLoading;
        if (isLoading) {
            btnSpinner.style.display = 'inline-block';
            btnGenerate.querySelector('.btn-text').textContent = 'AI is Processing...';
        } else {
            btnSpinner.style.display = 'none';
            btnGenerate.querySelector('.btn-text').textContent = '✨ Generate Notes';
        }
    }
    function startProgressAnimation() {
        progressContainer.style.display = 'flex';
        progressBarFill.style.width = '10%';
        progressStatusText.textContent = 'Reading source material...';
    }
    function updateProgress(percent, statusText) {
        progressBarFill.style.width = `${percent}%`;
        if (statusText) progressStatusText.textContent = statusText;
    }
    function stopProgressAnimation() {
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressBarFill.style.width = '0%';
        }, 400);
    }
    async function callGroqApi(systemMsg, userPrompt) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentApiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemMsg },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.5,
                max_tokens: 1500
            })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `API HTTP ${response.status}`);
        }
        const data = await response.json();
        return data.choices[0].message.content.trim();
    }
    function generateDemoNotes(input, wantsSummary, wantsDetailed, wantsKeywords, style) {
        const titleWords = input.split(/\s+/).slice(0, 6).join(' ');
        const cleanTitle = titleWords.replace(/[^a-zA-Z0-9\s]/g, '') || 'Study Topics';
        let summary = '';
        let notes = '';
        let key_points = '';
        if (wantsSummary) {
            summary = `This material covers the core principles of **${cleanTitle}**. It details fundamental theoretical rules, operational frameworks, and real-world applications necessary for mastering the subject effectively.`;
        }
        if (wantsDetailed) {
            notes = `## 1. Overview & Core Principles\n\n` +
                `The study of **${cleanTitle}** is essential for building structured analytical knowledge.\n\n` +
                `- **Primary Goal**: Establish systematic understanding of key mechanics.\n` +
                `- **Application**: Used widely across modern technical and scientific fields.\n` +
                `- **Methodology**: Break complex problems into modular steps.\n\n` +
                `### Key Mechanics\n\n` +
                `1. **Systematic Framework**: Organizes foundational concepts logically.\n` +
                `2. **Operational Rules**: Ensures consistent and predictable outcomes.\n` +
                `3. **Practical Utility**: Connects abstract concepts directly to practical scenarios.\n\n` +
                `## 2. Practical Takeaways & Strategy\n\n` +
                `- **Step 1**: Identify key inputs and environmental constraints.\n` +
                `- **Step 2**: Apply core principles to solve the objective.\n` +
                `- **Step 3**: Validate results against theoretical benchmarks.`;
        }
        if (wantsKeywords) {
            key_points = `- **${cleanTitle}**: Central subject of study.\n` +
                `- **Framework**: Systematic method for problem resolution.\n` +
                `- **Core Logic**: Governing rules driving behavior and outputs.\n` +
                `- **Validation**: Verification process ensuring accuracy.`;
        }
        return {
            topic: cleanTitle,
            date: new Date().toLocaleDateString(),
            summary,
            notes,
            key_points
        };
    }
    // --- Output Rendering ---
    function renderOutput(data) {
        placeholderState.style.display = 'none';
        outputContent.style.display = 'block';
        reportTitle.textContent = data.topic ? (data.topic.charAt(0).toUpperCase() + data.topic.slice(1)) : 'Study Report';
        if (data.summary) {
            summaryBox.style.display = 'block';
            summaryText.innerHTML = marked.parse(data.summary);
        } else {
            summaryBox.style.display = 'none';
        }
        if (data.notes) {
            detailedNotesContainer.style.display = 'block';
            detailedNotesContent.innerHTML = marked.parse(data.notes);
        } else {
            detailedNotesContainer.style.display = 'none';
        }
        if (data.key_points) {
            keyPointsContainer.style.display = 'block';
            keyPointsContent.innerHTML = marked.parse(data.key_points);
        } else {
            keyPointsContainer.style.display = 'none';
        }
    }
    // --- Interactive Flashcards Generator ---
    function buildFlashcards(data) {
        flashcardsDeck = [];
        currentCardIndex = 0;
        if (data.key_points) {
            const lines = data.key_points.split('\n');
            lines.forEach(line => {
                if (line.includes('**') || line.includes(':')) {
                    const parts = line.replace(/^[*\-\d.\s]+/, '').split(':');
                    if (parts.length >= 2) {
                        const term = parts[0].replace(/\*/g, '').trim();
                        const def = parts.slice(1).join(':').replace(/\*/g, '').trim();
                        if (term && def) {
                            flashcardsDeck.push({ term, def });
                        }
                    }
                }
            });
        }
        if (flashcardsDeck.length === 0) {
            flashcardsDeck.push({
                term: data.topic || 'Core Concept',
                def: data.summary || 'Summary of the studied material.'
            });
        }
        renderFlashcard();
    }
    function renderFlashcard() {
        if (!flashcardsDeck.length) return;
        const card = flashcardsDeck[currentCardIndex];
        flashcardFront.textContent = card.term;
        flashcardBack.textContent = card.def;
        cardCounter.textContent = `${currentCardIndex + 1} / ${flashcardsDeck.length}`;
        flashcardElem.classList.remove('flipped');
    }
    flashcardElem.addEventListener('click', () => {
        flashcardElem.classList.toggle('flipped');
    });
    btnPrevCard.addEventListener('click', () => {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            renderFlashcard();
        }
    });
    btnNextCard.addEventListener('click', () => {
        if (currentCardIndex < flashcardsDeck.length - 1) {
            currentCardIndex++;
            renderFlashcard();
        }
    });
    btnToggleFlashcards.addEventListener('click', () => {
        btnToggleFlashcards.classList.toggle('active');
        if (flashcardsContainer.style.display === 'flex') {
            flashcardsContainer.style.display = 'none';
        } else {
            flashcardsContainer.style.display = 'flex';
        }
    });
    // --- Audio Reader (Text-to-Speech) ---
    btnAudioReader.addEventListener('click', () => {
        if (isSpeaking) {
            synth.cancel();
            isSpeaking = false;
            btnAudioReader.classList.remove('active');
            btnAudioReader.querySelector('span:last-child').textContent = 'Audio Read';
            showToast('Stopped audio reader.');
        } else {
            if (!generatedResults) return;
            const cleanText = (generatedResults.summary + ' ' + generatedResults.notes).replace(/[#*`\-_]/g, '');
            if (!cleanText.trim()) return;
            currentUtterance = new SpeechSynthesisUtterance(cleanText);
            currentUtterance.rate = 1.0;
            currentUtterance.pitch = 1.0;
            currentUtterance.onend = () => {
                isSpeaking = false;
                btnAudioReader.classList.remove('active');
                btnAudioReader.querySelector('span:last-child').textContent = 'Audio Read';
            };
            synth.speak(currentUtterance);
            isSpeaking = true;
            btnAudioReader.classList.add('active');
            btnAudioReader.querySelector('span:last-child').textContent = 'Stop Audio';
            showToast('Playing audio read...');
        }
    });
    // --- In-Notes Real-Time Search ---
    btnToggleSearch.addEventListener('click', () => {
        btnToggleSearch.classList.toggle('active');
        searchNotesBar.style.display = searchNotesBar.style.display === 'block' ? 'none' : 'block';
        if (searchNotesBar.style.display === 'block') {
            searchNotesInput.focus();
        }
    });
    searchNotesInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!generatedResults) return;
        if (!query) {
            renderOutput(generatedResults);
            return;
        }
        const elements = [summaryText, detailedNotesContent, keyPointsContent];
        elements.forEach(elem => {
            if (elem && elem.innerHTML) {
                const raw = elem.innerHTML;
                const regex = new RegExp(`(${query})`, 'gi');
                elem.innerHTML = raw.replace(regex, '<mark class="search-highlight">$1</mark>');
            }
        });
    });
    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter to generate
        if (e.ctrlKey && e.key === 'Enter') {
            btnGenerate.click();
        }
        // Esc to close modal
        if (e.key === 'Escape') {
            if (apiModal.classList.contains('active')) {
                apiModal.classList.remove('active');
            }
        }
    });
    // --- History View Rendering ---
    function renderHistory() {
        if (!historyList) return;
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = `<div class="placeholder-state" style="min-height: 250px;"><p>No study note history found. Generate some notes in the workspace to see them here!</p></div>`;
            return;
        }
        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            historyItem.innerHTML = `
                <div class="history-item-header">
                    <span class="history-topic">#${history.length - index}: ${escapeHtml(item.topic)}</span>
                    <span class="history-date">${item.date || ''} 🔽</span>
                </div>
                <div class="history-body">
                    ${item.summary ? `<div class="summary-box"><strong>Summary:</strong> ${marked.parse(item.summary)}</div>` : ''}
                    ${item.notes ? `<div><strong>Detailed Notes:</strong> ${marked.parse(item.notes)}</div>` : ''}
                    ${item.key_points ? `<div style="margin-top: 12px;"><strong>Key Points:</strong> ${marked.parse(item.key_points)}</div>` : ''}
                </div>
            `;
            const header = historyItem.querySelector('.history-item-header');
            const body = historyItem.querySelector('.history-body');
            header.addEventListener('click', () => {
                body.classList.toggle('open');
            });
            historyList.appendChild(historyItem);
        });
    }
    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    // --- API Modal Controls ---
    btnOpenApiModal.addEventListener('click', () => {
        apiKeyInput.value = currentApiKey;
        apiModal.classList.add('active');
    });
    btnCloseApiModal.addEventListener('click', () => {
        apiModal.classList.remove('active');
    });
    btnSaveApiKey.addEventListener('click', () => {
        currentApiKey = apiKeyInput.value.trim();
        localStorage.setItem('groq_api_key', currentApiKey);
        updateApiBadge();
        apiModal.classList.remove('active');
        showToast(currentApiKey ? 'Groq API Key saved successfully!' : 'Switched to Demo Mode.');
    });
    // --- Export Functionality ---
    btnExportPdf.addEventListener('click', () => {
        if (!generatedResults) return;
        const element = document.createElement('div');
        element.style.padding = '20px';
        element.style.color = '#000000';
        element.style.backgroundColor = '#ffffff';
        element.innerHTML = `
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #2563eb;">AI Generated Study Notes</h1>
            <h2 style="font-size: 18px; color: #333333; margin-bottom: 20px;">Topic: ${escapeHtml(generatedResults.topic)}</h2>
            <hr style="margin-bottom: 20px; border-top: 1px solid #cccccc;"/>
            ${generatedResults.summary ? `<h3 style="color: #1d4ed8;">Summary</h3><p>${marked.parse(generatedResults.summary)}</p><br/>` : ''}
            ${generatedResults.notes ? `<h3 style="color: #1d4ed8;">Detailed Notes</h3><div>${marked.parse(generatedResults.notes)}</div><br/>` : ''}
            ${generatedResults.key_points ? `<h3 style="color: #1d4ed8;">Key Points</h3><div>${marked.parse(generatedResults.key_points)}</div>` : ''}
        `;
        const opt = {
            margin:       0.5,
            filename:     `Study_Notes_${Date.now()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
        showToast('Downloading PDF...');
    });
    btnDownloadTxt.addEventListener('click', () => {
        if (!generatedResults) return;
        const fullText = `=== AI GENERATED STUDY NOTES ===\n` +
            `Topic: ${generatedResults.topic}\n` +
            `Date: ${generatedResults.date}\n\n` +
            `--- SUMMARY ---\n${generatedResults.summary || 'N/A'}\n\n` +
            `--- DETAILED NOTES ---\n${generatedResults.notes || 'N/A'}\n\n` +
            `--- KEY POINTS & KEYWORDS ---\n${generatedResults.key_points || 'N/A'}\n`;
        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Study_Notes_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded TXT file!');
    });
    btnCopyTxt.addEventListener('click', () => {
        if (!generatedResults) return;
        const fullText = `=== AI GENERATED STUDY NOTES ===\n` +
            `Topic: ${generatedResults.topic}\n\n` +
            `SUMMARY:\n${generatedResults.summary}\n\n` +
            `NOTES:\n${generatedResults.notes}\n\n` +
            `KEY POINTS:\n${generatedResults.key_points}`;
        navigator.clipboard.writeText(fullText).then(() => {
            showToast('Copied notes to clipboard!');
        }).catch(() => {
            showToast('Failed to copy text.', 'error');
        });
    });
    btnExportPpt.addEventListener('click', () => {
        if (!generatedResults) return;
        const pptContent = {
            title: generatedResults.topic,
            slides: [
                { header: "Summary", content: generatedResults.summary },
                { header: "Detailed Notes", content: generatedResults.notes },
                { header: "Key Points", content: generatedResults.key_points }
            ]
        };
        const blob = new Blob([JSON.stringify(pptContent, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Slide_Outline_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Exported PowerPoint slide outline (JSON format)!');
    });
});
