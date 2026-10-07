import os
import json
from typing import List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import urllib.request
import re
from pywebpush import webpush, WebPushException

# Load environment variables
load_dotenv()

# Initialize Supabase Client
from supabase import create_client, Client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("WARNING: Missing Supabase credentials in environment.")
    supabase: Client | None = None
else:
    supabase: Client = create_client(supabase_url, supabase_key)

# Initialize Gemini Client
from google import genai
from google.genai import types

gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    print("WARNING: Missing Gemini API key.")
    client = None
else:
    client = genai.Client(api_key=gemini_api_key)

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_SUBJECT = os.getenv("VAPID_SUBJECT")

app = FastAPI(title="TrueSkills AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "https://trueskills.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PushSubscriptionModel(BaseModel):
    user_id: str
    endpoint: str
    p256dh: str
    auth: str

class NotificationPayload(BaseModel):
    receiver_id: str
    title: str
    body: str

# NOTE: Endpoints that call the (synchronous) Supabase / Gemini / urllib / webpush
# clients are declared with plain `def` so FastAPI runs them in its threadpool.
# Declaring them `async def` would block the event loop and serialize every request.

@app.post("/api/notifications/subscribe")
def subscribe_notification(sub: PushSubscriptionModel):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    data = {
        "user_id": sub.user_id,
        "endpoint": sub.endpoint,
        "p256dh": sub.p256dh,
        "auth": sub.auth
    }
    
    res = supabase.table("push_subscriptions").select("*").eq("endpoint", sub.endpoint).execute()
    if len(res.data) > 0:
        return {"status": "already subscribed"}
        
    supabase.table("push_subscriptions").insert(data).execute()
    return {"status": "success"}

@app.post("/api/notifications/notify")
def send_notification(payload: NotificationPayload):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    if not VAPID_PRIVATE_KEY or not VAPID_SUBJECT:
        return {"status": "push not configured"}
        
    res = supabase.table("push_subscriptions").select("*").eq("user_id", payload.receiver_id).execute()
    subs = res.data
    
    if not subs:
        return {"status": "no subscriptions found"}
        
    for sub in subs:
        try:
            subscription_info = {
                "endpoint": sub["endpoint"],
                "keys": {
                    "p256dh": sub["p256dh"],
                    "auth": sub["auth"]
                }
            }
            webpush(
                subscription_info=subscription_info,
                data=json.dumps({"title": payload.title, "body": payload.body}),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_SUBJECT}
            )
        except WebPushException as ex:
            print("Web push failed:", ex)
            # requests.Response is falsy for 4xx/5xx, so compare against None explicitly
            if ex.response is not None and ex.response.status_code in [404, 410]:
                supabase.table("push_subscriptions").delete().eq("id", sub["id"]).execute()
                
    return {"status": "success", "notified": len(subs)}

@app.get("/")
def read_root():
    return {"message": "Welcome to the TrueSkills AI backend!"}

@app.get("/api/ai/health")
def health_check():
    return {"status": "ok", "supabase": supabase is not None, "gemini": client is not None}

@app.post("/api/ai/parse-resume")
def parse_resume(
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Parses a resume PDF using Gemini 2.5 Flash, extracts skills, and saves them to Supabase.
    """
    if not client or not supabase:
        raise HTTPException(status_code=500, detail="AI or Database not configured properly.")

    try:
        # 1. Read PDF bytes
        content = file.file.read()
        
        # 2. Use Gemini 2.5 Flash to extract skills
        # We specify response_mime_type="application/json" and give a strict schema
        prompt = """
        You are an expert technical recruiter and resume parser. 
        Extract a list of technical and soft skills from this resume.
        For each skill, determine a self-rated level based on the resume's context: 'beginner', 'intermediate', or 'advanced'.
        Only return a JSON array of objects with 'name' and 'level' keys.
        """
        
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=[
                types.Part.from_bytes(data=content, mime_type=file.content_type or 'application/pdf'),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        # Parse the JSON response
        try:
            skills_data = json.loads(response.text)
        except json.JSONDecodeError:
            print("Failed to parse Gemini response as JSON:", response.text)
            raise HTTPException(status_code=500, detail="Failed to parse resume.")
            
        # Gemini sometimes wraps the array in an object, e.g. {"skills": [...]}
        if isinstance(skills_data, dict):
            skills_data = next((v for v in skills_data.values() if isinstance(v, list)), [])
        if not isinstance(skills_data, list):
            skills_data = []

        # Normalise + de-duplicate (keep first level seen per skill)
        levels_by_name: Dict[str, str] = {}
        for item in skills_data:
            if not isinstance(item, dict):
                continue
            skill_name = str(item.get('name') or '').strip().lower()
            level = str(item.get('level') or '').strip().lower()
            if not skill_name:
                continue
            if level not in ['beginner', 'intermediate', 'advanced']:
                level = 'intermediate'
            levels_by_name.setdefault(skill_name, level)

        print(f"Extracted {len(levels_by_name)} skills for user {user_id}")

        if levels_by_name:
            # 3. Store in Supabase using batched queries (previously 2-4 round trips per skill)
            names = list(levels_by_name.keys())
            existing = supabase.table('skills').select('id, name').in_('name', names).execute()
            id_by_name = {s['name']: s['id'] for s in existing.data}

            missing = [{'name': n} for n in names if n not in id_by_name]
            if missing:
                created = supabase.table('skills').insert(missing).execute()
                id_by_name.update({s['name']: s['id'] for s in created.data})

            rows = [
                {'user_id': user_id, 'skill_id': id_by_name[n], 'self_rated_level': lvl}
                for n, lvl in levels_by_name.items() if n in id_by_name
            ]
            # unique(user_id, skill_id) -> skip skills the user already has
            supabase.table('user_skills').upsert(
                rows, on_conflict='user_id,skill_id', ignore_duplicates=True
            ).execute()

        return {"status": "success", "extracted_skills": len(levels_by_name)}
        
    except HTTPException:
        raise
    except Exception as e:
        print("Error in parse_resume:", e)
        raise HTTPException(status_code=500, detail=str(e))

class EmbeddingRequest(BaseModel):
    user_id: str

@app.post("/api/ai/generate-profile-embedding")
def generate_profile_embedding(req: EmbeddingRequest):
    """
    Generates an embedding vector for a user's profile and skills, 
    and saves it to the embeddings table.
    """
    if not client or not supabase:
        raise HTTPException(status_code=500, detail="AI or Database not configured properly.")
        
    user_id = req.user_id
    
    try:
        # 1. Fetch profile and skills
        profile_res = supabase.table('student_profiles').select('*').eq('user_id', user_id).execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="Student profile not found.")
            
        profile = profile_res.data[0]
        
        skills_res = supabase.table('user_skills').select('self_rated_level, skills(name)').eq('user_id', user_id).execute()
        
        projects_res = supabase.table('projects').select('title, description, is_github_verified').eq('user_id', user_id).execute()
        
        # 2. Construct text representation
        skills_text = ", ".join([f"{s['skills']['name']} ({s['self_rated_level']})" for s in skills_res.data if s.get('skills')])
        
        projects_text = "\n".join([f"Project: {p.get('title', '')} {'[GitHub Verified]' if p.get('is_github_verified') else ''} - {p.get('description', '')}" for p in projects_res.data])
        
        profile_text = f"Candidate Name: {profile.get('full_name', '')}\n"
        profile_text += f"Location: {profile.get('location', '')}\n"
        profile_text += f"Bio: {profile.get('bio', '')}\n"
        profile_text += f"Skills: {skills_text}\n"
        profile_text += f"Projects: \n{projects_text}\n"
        
        # 3. Generate embedding using Gemini
        result = client.models.embed_content(
            model='gemini-embedding-2',
            contents=profile_text,
            config=types.EmbedContentConfig(output_dimensionality=768)
        )
        
        embedding = result.embeddings[0].values
        
        # 4. Upsert into embeddings table
        # Check if exists
        existing = supabase.table('embeddings').select('id').eq('owner_type', 'user_profile').eq('owner_id', user_id).execute()
        
        if existing.data:
            supabase.table('embeddings').update({'embedding': embedding}).eq('id', existing.data[0]['id']).execute()
        else:
            supabase.table('embeddings').insert({
                'owner_type': 'user_profile',
                'owner_id': user_id,
                'embedding': embedding
            }).execute()
            
        return {"status": "success", "message": "Embedding generated and stored."}
        
    except HTTPException:
        raise
    except Exception as e:
        print("Error in generate_profile_embedding:", e)
        raise HTTPException(status_code=500, detail=str(e))

class SearchCandidatesRequest(BaseModel):
    query: str
    match_threshold: float = 0.5
    match_count: int = 10

@app.post("/api/ai/search-candidates")
def search_candidates(req: SearchCandidatesRequest):
    """
    Performs semantic search across candidate profiles using pgvector.
    """
    if not client or not supabase:
        raise HTTPException(status_code=500, detail="AI or Database not configured properly.")
        
    try:
        # 1. Generate embedding for the search query
        result = client.models.embed_content(
            model='gemini-embedding-2',
            contents=req.query,
            config=types.EmbedContentConfig(output_dimensionality=768)
        )
        query_embedding = result.embeddings[0].values
        
        # 2. Call the match_embeddings RPC in Supabase
        response = supabase.rpc(
            'match_embeddings', 
            {
                'query_embedding': query_embedding,
                'match_threshold': req.match_threshold,
                'match_count': req.match_count
            }
        ).execute()
        
        # 3. Fetch full profile details for the matched users
        matched_users = response.data
        if not matched_users:
            return {"results": []}
            
        user_ids = [m['owner_id'] for m in matched_users]
        
        # Fetch profiles
        profiles_res = supabase.table('student_profiles').select('user_id, full_name, bio, location, avatar_url').in_('user_id', user_ids).execute()
        
        # Fetch skills
        skills_res = supabase.table('user_skills').select('user_id, self_rated_level, skills(name)').in_('user_id', user_ids).execute()
        
        # Fetch projects
        projects_res = supabase.table('projects').select('user_id, id, title, description, is_github_verified, github_url').in_('user_id', user_ids).execute()
        
        # Assemble the results
        results_map = {}
        for p in profiles_res.data:
            uid = p['user_id']
            results_map[uid] = p
            results_map[uid]['skills'] = []
            results_map[uid]['projects'] = []
            
        for s in skills_res.data:
            uid = s['user_id']
            if uid in results_map and s.get('skills'):
                results_map[uid]['skills'].append({
                    'name': s['skills']['name'],
                    'level': s['self_rated_level']
                })
                
        for p in projects_res.data:
            uid = p['user_id']
            if uid in results_map:
                results_map[uid]['projects'].append({
                    'id': p['id'],
                    'title': p['title'],
                    'description': p['description'],
                    'is_github_verified': p.get('is_github_verified', False),
                    'github_url': p.get('github_url', '')
                })
                
        # Combine with similarity scores and maintain order
        final_results = []
        for match in matched_users:
            uid = match['owner_id']
            if uid in results_map:
                profile_data = results_map[uid]
                profile_data['similarity'] = match['similarity']
                final_results.append(profile_data)
                
        return {"results": final_results}
        
    except Exception as e:
        print("Error in search_candidates:", e)
        raise HTTPException(status_code=500, detail=str(e))

class CandidateSummaryRequest(BaseModel):
    candidate_data: dict

@app.post("/api/ai/candidate-summary")
def candidate_summary(req: CandidateSummaryRequest):
    if not client:
        raise HTTPException(status_code=500, detail="AI not configured.")
        
    prompt = f"""
    You are an expert technical recruiter. Based on the following candidate profile, provide a concise 3-sentence summary of their strengths and best fit.
    IMPORTANT INSTRUCTION: If any of their projects have the "is_github_verified" flag set to True, you MUST explicitly mention in your summary that their skills are backed by a verified GitHub repository for that project.
    
    Candidate Data:
    {json.dumps(req.candidate_data, indent=2)}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        return {"summary": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DraftOutreachRequest(BaseModel):
    candidate_data: dict
    job_description: str
    recruiter_name: str
    company_name: str

@app.post("/api/ai/draft-outreach")
def draft_outreach(req: DraftOutreachRequest):
    if not client:
        raise HTTPException(status_code=500, detail="AI not configured.")
        
    prompt = f"""
    Write a short, engaging LinkedIn-style outreach message from {req.recruiter_name} at {req.company_name} to this candidate.
    
    Job Description context:
    {req.job_description}
    
    Candidate Data:
    {json.dumps(req.candidate_data, indent=2)}
    
    Keep it under 150 words, highly personalized based on their skills, and professional.
    Do not use any markdown formatting (like **bold** or *italics*), and do not include placeholders like (For example *Text*). Provide only the final plain text message ready to be sent.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        return {"message": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ScreenBiasRequest(BaseModel):
    job_description: str

@app.post("/api/ai/screen-bias")
def screen_bias(req: ScreenBiasRequest):
    if not client:
        raise HTTPException(status_code=500, detail="AI not configured.")
        
    prompt = f"""
    Analyze the following job description for unconscious bias (e.g., gendered language, ageism, overly aggressive "bro-culture" terms, exclusionary requirements).
    Return a JSON object with:
    - 'has_bias': boolean
    - 'issues': array of strings (the problematic phrases)
    - 'suggestions': array of strings (how to fix them)
    
    Job Description:
    {req.job_description}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ApplicantMatchRequest(BaseModel):
    job_description: str
    applicants: List[Dict[str, Any]]

@app.post("/api/ai/match-applicants")
def match_applicants(req: ApplicantMatchRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured")
    
    prompt = f"""
    You are an AI hiring assistant. You will be given a job description and a list of applicants.
    For each applicant, evaluate their fit for the job based on their profile data (bio, skills, location).
    Output a JSON array of objects. Each object should have:
    - 'user_id': exactly as provided in the input
    - 'score': 0 to 100 representing the match score
    - 'rationale': a 1-2 sentence explanation of why they received this score.

    Job Description:
    {req.job_description}

    Applicants:
    {json.dumps(req.applicants)}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        data = json.loads(response.text)
        return {"rankings": data}
    except Exception as e:
        print(f"Error matching applicants: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class SkillConfidenceRequest(BaseModel):
    skill_name: str
    self_rated_level: str
    user_profile: Dict[str, Any]
    projects: List[Dict[str, Any]] = []
    competitions: List[Dict[str, Any]] = []

@app.post("/api/ai/skill-confidence")
def skill_confidence(req: SkillConfidenceRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured")
    
    prompt = f"""
    You are an AI skill validator. Analyze the candidate's self-rated skill based on their profile, projects, and competition history.
    Skill: {req.skill_name} (Self-rated: {req.self_rated_level})
    
    Profile: {json.dumps(req.user_profile)}
    Projects: {json.dumps(req.projects)}
    Competitions: {json.dumps(req.competitions)}
    
    Provide your response as JSON with two fields:
    - 'confidence_score': A number from 0 to 100 indicating how confident we can be in this skill level based on the evidence.
    - 'rationale': A 1-2 sentence explanation. If they lack projects or competitions using this skill, the score should be lower.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error computing skill confidence: {e}")
        if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
            return {"confidence_score": 0, "rationale": "AI is currently busy due to high traffic. Please try again later."}
        raise HTTPException(status_code=500, detail=str(e))

class CollaborationSignalsRequest(BaseModel):
    user_profile: Dict[str, Any]
    team_competitions: List[Dict[str, Any]] = []

@app.post("/api/ai/collaboration-signals")
def collaboration_signals(req: CollaborationSignalsRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured")
    
    prompt = f"""
    You are an AI team dynamics analyzer. Review the candidate's team competition history and profile.
    
    Profile: {json.dumps(req.user_profile)}
    Team Competitions & Roles: {json.dumps(req.team_competitions)}
    
    Output a JSON object with:
    - 'signals': An array of strings representing tags (e.g. "Team Lead", "Consistent Contributor", "Mentor", "Lone Wolf"). Choose 1 to 3 tags.
    - 'rationale': A 1-2 sentence explanation of why these tags apply based on the frequency and roles in their team history.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating collaboration signals: {e}")
        if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
            return {"signals": ["AI Busy"], "rationale": "AI is currently busy due to high traffic. Please try again later."}
        raise HTTPException(status_code=500, detail=str(e))

class VerifyProjectRequest(BaseModel):
    project_id: str

@app.post("/api/ai/verify-project")
def verify_project(req: VerifyProjectRequest):
    if not client or not supabase:
        raise HTTPException(status_code=500, detail="AI or Database not configured properly.")
        
    try:
        project_res = supabase.table('projects').select('*').eq('id', req.project_id).execute()
        if not project_res.data:
            raise HTTPException(status_code=404, detail="Project not found.")
            
        project = project_res.data[0]
        
        if not project.get('github_url'):
            return {"status": "skipped", "message": "No github_url provided."}
            
        github_url = project['github_url'].strip()
        match = re.search(r'github\.com/([^/]+)/([^/]+)', github_url)
        if not match:
            return {"status": "skipped", "message": "Invalid GitHub URL format."}
            
        owner, repo = match.groups()
        repo = repo.replace('.git', '')
        
        # Fetch GitHub repo metadata
        api_url = f"https://api.github.com/repos/{owner}/{repo}"
        gh_req = urllib.request.Request(api_url, headers={'User-Agent': 'TrueSkills-AI'})
        try:
            with urllib.request.urlopen(gh_req, timeout=10) as response:
                repo_data = json.loads(response.read().decode())
        except Exception as e:
            return {"status": "error", "message": f"Failed to fetch GitHub repo: {str(e)}"}
            
        repo_info = {
            "name": repo_data.get("name"),
            "description": repo_data.get("description"),
            "language": repo_data.get("language"),
            "topics": repo_data.get("topics", [])
        }
        
        prompt = f"""
        Does this GitHub repository metadata match the claimed project?
        
        Claimed Project Title: {project.get('title')}
        Claimed Description: {project.get('description')}
        
        GitHub Repo Data:
        {json.dumps(repo_info, indent=2)}
        
        Respond with ONLY 'YES' if it matches closely, or 'NO' if it doesn't.
        """
        
        ai_res = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        
        result_text = ai_res.text.strip().upper()
        if 'YES' in result_text:
            supabase.table('projects').update({'is_github_verified': True}).eq('id', req.project_id).execute()
            return {"status": "verified", "message": "Project verified successfully!"}
            
        return {"status": "failed", "message": "AI could not verify the repository matches the project."}
        
    except HTTPException:
        raise
    except Exception as e:
        print("Error verifying project:", e)
        if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
            return {"status": "failed", "message": "AI is currently busy due to high traffic. Please try again later."}
        raise HTTPException(status_code=500, detail=str(e))
