<div align="center">
  <img src="./frontend/public/logo.png" alt="TrueSkills Logo" width="80" />
  <h1>TrueSkills</h1>
  <p><strong>The New Standard in Hiring. Top 1% Verified by AI.</strong></p>
  
  <p>
    TrueSkills bridges the gap between top-tier talent and forward-thinking companies. 
    It replaces traditional resumes with verified skills, coding challenges, and AI-powered semantic matching.
  </p>
</div>

<br />

## 🚀 Tech Stack

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
</div>
<div align="center">
  <img src="https://img.shields.io/badge/Python-FFD43B?style=for-the-badge&logo=python&logoColor=blue" alt="Python" />
  <img src="https://img.shields.io/badge/fastapi-109989?style=for-the-badge&logo=FASTAPI&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
</div>

---

## ✨ Features

### For Candidates
* **Dynamic Profiles:** Build a striking portfolio with integrated GitHub verification.
* **Competitions & Challenges:** Prove your skills in real-world hackathons and coding challenges.
* **Skill Verification:** Move beyond self-reported skills; let your code and project history verify your capabilities.
* **AI Resume Parser:** Instantly generate a rich profile from your existing PDF resume.

### For Recruiters
* **Semantic Search:** Don't just search for keywords. Ask the AI: *"I need a senior frontend dev who has built complex dashboards"* and get instant, accurate matches.
* **Candidate Summaries:** Get AI-generated summaries of a candidate's strengths, weaknesses, and potential culture fit.
* **Automated Outreach:** Generate highly personalized outreach emails drafted by AI based on the candidate's specific background.
* **Bias Detection:** Ensure fair hiring practices with AI tools that flag potentially biased screening criteria.

---

## 🛠️ Getting Started

### Prerequisites
* Node.js (v18 or higher)
* Python (3.10 or higher)
* A [Supabase](https://supabase.com/) Account
* A [Google Gemini](https://aistudio.google.com/) API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/devrizu/trueskills.git
   cd trueskills
   ```

2. **Setup the Backend (FastAPI):**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
   *Create a `.env` file in the `backend` folder with:*
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Setup the Frontend (React + Vite):**
   ```bash
   cd ../frontend
   npm install
   ```
   *Create a `.env` file in the `frontend` folder with:*
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   ```

### Running Locally

You'll need two terminal windows to run both the frontend and backend simultaneously.

**Terminal 1 (Backend):**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

---

## 📄 License
This project is licensed under the GNU General Public License v3.0 (GPLv3) - see the LICENSE file for details.
