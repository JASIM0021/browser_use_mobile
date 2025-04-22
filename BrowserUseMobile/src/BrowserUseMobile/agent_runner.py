import os
import asyncio
from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from browser_use import Agent, Browser, BrowserConfig
from typing import Optional

# Get the absolute path to the .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI()

class TaskRequest(BaseModel):
    task: str
    model: str = "gpt-4o"
    apiKey:str = ""
    browser_path: Optional[str] = None

@app.post("/run-task")
async def run_task(req: TaskRequest):
    # Get API key with more reliable fallback
    # api_key = os.getenv("OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY")
    
    # if not api_key:
    #     return {
    #         "status": "error", 
    #         "message": "API Key not found. Please set OPENAI_API_KEY in .env file or environment variables.",
    #         "env_location": str(env_path)
    #     }

    try:
        agent = Agent(
            task=req.task,
            llm=ChatOpenAI(
                model=req.model,
                api_key=req.apiKey,
                temperature=0.7
            ),
            browser=Browser(BrowserConfig(browser_path=req.browser_path, close_after_task=False)) if req.browser_path else None
        )
        
        await agent.run()
        return {"status": "success", "task": req.task}
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "type": type(e).__name__
        }


# @app.get("/debug-env")
# async def debug_env():
#     return {
#         "env_location": str(env_path),
#         "api_key_set": bool(os.getenv("OPENAI_API_KEY")),
#         "current_directory": os.listdir(Path(__file__).parent)
#     }
def run_agent_server_with_logger(logger=None):
    import uvicorn
    
    def log(msg):
        print(msg)
        if logger:
            logger(f"[SERVER] {msg}")
    
    log(f"Loading environment from: {env_path}")
    log(f"Current API key: {'set' if os.getenv('OPENAI_API_KEY') else 'not set'}")
    
    uvicorn.run(
        app,  # Pass the app instance directly
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="debug"
    )
