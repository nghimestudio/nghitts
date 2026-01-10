# NGHI-TTS

A browser-based Vietnamese Text-to-Speech application powered by Piper TTS models and ONNX Runtime Web. Generate high-quality speech directly in your browser without requiring a server for inference. Live demo: https://text2speech.work.

## Features

- 🌐 **Browser-Based TTS**: Fully client-side text-to-speech processing using Web Workers
- 🇻🇳 **Vietnamese Language Support**: Advanced Vietnamese text processing with automatic conversion of:
  - Numbers to words (0 to billions)
  - Dates and date ranges
  - Time expressions
  - Currency (VND, USD)
  - Percentages and decimals
  - Phone numbers
  - Ordinals
- 🎤 **Multi-Speaker Models**: Support for models with multiple voices
- ⚡ **Real-Time Streaming**: Stream audio chunks as they're generated
- 🎚️ **Speed Control**: Adjustable speech speed
- 📥 **Audio Download**: Export generated audio as WAV files
- 🌙 **Dark Mode**: Built-in theme toggle
- 📊 **Text Statistics**: Character and word count display
- 🔄 **Dynamic Model Loading**: Load models on-demand from Cloudflare R2 storage

## 🧠 Model Training Details

This project is built on top of Piper TTS and fine-tuned using a custom dataset to generate realistic voices.
Please see the Training Video here: https://www.youtube.com/watch?v=WgvBOljtNvE



### 🔹 Base Model

- **Based on Piper (English checkpoint)**
- Lightweight, fast, and optimized for local inference
- Designed for real-time speech generation

### 🔹 Fine-Tuning Process

**Dataset:**
- Dataset size: ~1,000 audio samples
- Voices: Multiple famous celebrity voices
- Training method: Fine-tuning on existing Piper English checkpoint
- Epochs: ~2,000 epochs
- **Download training datasets**: [View Datasets on Google Drive](https://drive.google.com/drive/folders/1NwVRepCQ4HgOfTn4BR9pbYJOF2KkvG4h?usp=sharing)

Available datasets include:
- Vietnamese celebrity voices (Mỹ Tâm, Ngọc Ngân, Trấn Thành, Việt Thảo)
- Multi-speaker datasets
- Various dataset sizes (200, 1000+ samples)
- English voice datasets

**Audio Preparation:**
- Cleaned and normalized audio
- Matched text–audio pairs
- Consistent sample rate
- Noise removed

**What the Model Learns:**
- Voice tone
- Accent
- Speech rhythm
- Natural pronunciation

### ⚡ Inference Method

- **Web-based inference**: No server required
- **Runs fully locally**: All processing happens in your browser
- **Very fast inference**: ~5× real-time speed
- **User-friendly**: Simply enter text, select a voice, and generate speech instantly

### ✅ Key Benefits

- ✔ Based on Piper TTS
- ✔ Fine-tuned with 1,000+ audio samples
- ✔ Trained for ~2,000 epochs
- ✔ No server required
- ✔ Web-based & lightweight
- ✔ Fast inference (≈5× real-time)
- ✔ Free & open-source
- ✔ Allowed for commercial use
- ✔ Easy to deploy or modify

## 📦 Available Models

Pre-trained Vietnamese TTS models are available for download:

**Download from Google Drive**: [View Available Models](https://drive.google.com/drive/folders/1f_pCpvgqfvO4fdNKM7WS4zTuXC0HBskL?usp=drive_link)

### Model List

1. **calmwoman3688** (~60.6 MB)
   - Files: `calmwoman3688.onnx` + `calmwoman3688.onnx.json`
   - Description: Female voice

2. **deepman3909** (~60.6 MB)
   - Files: `deepman3909.onnx` + `deepman3909.onnx.json`
   - Description: Male voice

3. **ngocngan3701** (~60.6 MB)
   - Files: `ngocngan3701.onnx` + `ngocngan3701.onnx.json`
   - Description: Vietnamese celebrity voice (Ngọc Ngân)

4. **vietthao3886** (~60.6 MB)
   - Files: `vietthao3886.onnx` + `vietthao3886.onnx.json`
   - Description: Vietnamese celebrity voice (Việt Thảo)
     
5. **New Voices**: Mỹ Tâm, Trấn Thành, Ngọc Huyền (review phim), Oryx (giọng nam siêu trầm)

### Model File Structure

Each model requires **two files** with the same base name:
- `{model-name}.onnx` - The ONNX model file (binary)
- `{model-name}.onnx.json` - The model configuration file (JSON)

**For local development**, place both files in the `public/tts-model/` folder:
```
public/
└── tts-model/
    ├── calmwoman3688.onnx
    ├── calmwoman3688.onnx.json
    ├── deepman3909.onnx
    ├── deepman3909.onnx.json
    └── ... (other models)
```

The application will automatically detect all models in this folder when you run `npm run dev`.

## Tech Stack

- **Frontend**: Vue 3 + Vite
- **TTS Engine**: Piper TTS (ONNX format)
- **Runtime**: ONNX Runtime Web (WASM)
- **Hosting**: Cloudflare Pages
- **Storage**: Cloudflare R2 (for model files)
- **Styling**: Tailwind CSS
- **Icons**: Lucide Vue Next

## Project Structure

```
nghitts/
├── src/
│   ├── App.vue                 # Main application component
│   ├── components/             # Vue components
│   │   ├── AudioChunk.vue     # Audio playback component
│   │   ├── ModelSelector.vue  # Model selection dropdown
│   │   ├── SpeedControl.vue   # Speech speed slider
│   │   ├── TextStatistics.vue # Text stats display
│   │   ├── ThemeToggle.vue    # Dark/light mode toggle
│   │   └── VoiceSelector.vue  # Voice selection component
│   ├── lib/
│   │   └── piper-tts.js       # Piper TTS implementation
│   ├── utils/
│   │   ├── model-cache.js     # Model file caching
│   │   ├── model-detector.js  # Model discovery from API
│   │   ├── text-cleaner.js    # Text cleaning and chunking
│   │   └── vietnamese-processor.js  # Vietnamese text processing
│   └── workers/
│       └── tts-worker.js      # Web Worker for TTS processing
├── functions/
│   └── api/
│       ├── models.ts          # List available models
│       └── model/[name].ts    # Serve model files from R2
└── public/
    └── non-vietnamese-words.csv  # Word replacement dictionary
```

## How It Works

1. **Model Loading**: Models are stored in Cloudflare R2 and served via Cloudflare Pages Functions
2. **Text Processing**: Vietnamese text is processed to convert numbers, dates, times, etc. to spoken words
3. **Text Chunking**: Input text is intelligently split into chunks for optimal processing
4. **Phoneme Conversion**: Text is converted to phonemes using the phonemizer library
5. **Audio Generation**: ONNX Runtime Web runs the Piper TTS model in a Web Worker
6. **Streaming**: Audio chunks are streamed back to the main thread and played as they're generated
7. **Audio Merging**: Chunks are merged, normalized, and trimmed for final output

## Vietnamese Text Processing

The application includes comprehensive Vietnamese text processing that handles:

- **Numbers**: Automatic conversion to Vietnamese words (e.g., "123" → "một trăm hai mươi ba")
- **Dates**: Multiple formats (DD/MM/YYYY, DD-MM-YYYY, date ranges)
- **Times**: Time expressions (HH:MM, HH:MM:SS, "X giờ Y phút")
- **Currency**: VND (đồng) and USD conversion
- **Percentages**: Automatic conversion (e.g., "50%" → "năm mươi phần trăm")
- **Decimals**: Vietnamese decimal format (comma as decimal separator)
- **Phone Numbers**: Digit-by-digit reading
- **Ordinals**: Conversion of ordinal numbers (thứ 2 → thứ hai)

## Running Locally

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Setup Phonemizer

After running `npm install`, you need to manually move the `phonemizer` folder to `node_modules`:

1. **Locate the phonemizer folder** in your project (it should be in the project root)

2. **Copy the phonemizer folder to node_modules**:
   ```bash
   # On Windows (PowerShell)
   Copy-Item -Path "phonemizer" -Destination "node_modules\phonemizer" -Recurse -Force
   
   # On macOS/Linux
   cp -r phonemizer node_modules/
   ```

   Or manually:
   - Copy the entire `phonemizer` folder
   - Paste it into the `node_modules` directory
   - The final path should be: `node_modules/phonemizer/`

3. **Verify the setup**:
   - Check that `node_modules/phonemizer/` exists
   - Verify the folder contains:
     - `package.json`
     - `dist/phonemizer.js` (required)
     - `dist/phonemizer.cjs`
     - `types/` folder

4. **If you still get import errors**, try:
   - Delete `node_modules/.vite` folder (Vite cache)
   - Restart the development server
   - Ensure `node_modules/phonemizer/dist/phonemizer.js` exists

**Note**: The phonemizer package is required for text-to-phoneme conversion. Without it, the TTS generation will fail. The package must be in `node_modules/phonemizer/` for Vite to resolve it correctly.

### Step 3: Download Models

1. **Download models from Google Drive**: [View Available Models](https://drive.google.com/drive/folders/1f_pCpvgqfvO4fdNKM7WS4zTuXC0HBskL?usp=drive_link)

2. **Create the models directory** (if it doesn't exist):
   ```bash
   mkdir -p public/tts-model
   ```

3. **Place model files in `public/tts-model/` folder**:
   - Each model requires **two files**:
     - `{model-name}.onnx` - The ONNX model file (~60-80 MB)
     - `{model-name}.onnx.json` - The model configuration file
   - Example: For the `calmwoman3688` model, you need:
     - `public/tts-model/calmwoman3688.onnx`
     - `public/tts-model/calmwoman3688.onnx.json`

4. **Recommended models to start with**:
   - `calmwoman3688` - Female voice
   - `deepman3909` - Male voice
   - `ngocngan3701` - Vietnamese celebrity voice
   - `vietthao3886` - Vietnamese celebrity voice

   **Note**: You can download and use one or more models. The application will automatically detect all models in the `public/tts-model/` folder.

### Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

The development server automatically:
- Serves models from the `public/tts-model/` folder
- Lists available models via the `/api/models` endpoint
- Serves model files via `/api/model/{model-name}.onnx` and `/api/model/{model-name}.onnx.json`

### Step 5: Use the Application

1. Open your browser and navigate to the development server URL
2. Select a model from the dropdown (models are auto-detected from `public/tts-model/`)
3. Enter Vietnamese text in the text area
4. Select a voice (if the model supports multiple speakers)
5. Adjust the speed if needed
6. Click "Generate Speech" to create audio

## Development

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

This serves the production build locally for testing.

## Deployment

The project is configured for Cloudflare Pages deployment:

1. Models should be stored in a Cloudflare R2 bucket named `tts-bucket`
2. Models should be placed in the `piper/` prefix
3. Each model requires two files:
   - `{model-name}.onnx` - The ONNX model file
   - `{model-name}.onnx.json` - The model configuration file

The Cloudflare Pages Function at `/api/models` will automatically discover available models from the R2 bucket.

## Configuration

### Wrangler Configuration

The `wrangler.toml` file configures:
- Pages build output directory
- R2 bucket binding (`piper` → `tts-bucket`)

### Model Format

Models must be in Piper TTS ONNX format with:
- `.onnx` file containing the ONNX model
- `.onnx.json` file containing voice configuration (phoneme_id_map, audio settings, etc.)

## Features in Detail

### Text Cleaning

- Removes emojis and special characters
- Normalizes Unicode (NFC)
- Handles Vietnamese-specific punctuation
- Cleans whitespace

### Text Chunking

- Intelligently splits text into optimal chunks
- Respects sentence boundaries
- Handles long sentences by splitting at word boundaries
- Maintains minimum and maximum chunk sizes for optimal processing

### Audio Processing

- Real-time streaming of audio chunks
- Automatic normalization and peak limiting
- Silence trimming
- Sample rate preservation

## Browser Compatibility

- Modern browsers with WebAssembly support
- Web Workers support required
- ES Modules support required

## 📜 License & Usage

This project is:

- ✅ **Free to use**
- ✅ **Open source**
- ✅ **Allowed for commercial use**
- ✅ **Customizable and deployable**

⚠️ **Important**: Users are responsible for complying with voice and content laws when using generated audio.

## Acknowledgments

- Built on [Piper TTS (GPL)](https://github.com/OHF-Voice/piper1-gpl) by OHF-Voice
- Inspired by [piper-tts-web-demo](https://clowerweb.github.io/piper-tts-web-demo/) by clowerweb
- Uses [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) for browser-based inference
