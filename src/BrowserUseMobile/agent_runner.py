import os
import asyncio
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from browser_use import Agent, Browser, BrowserConfig

# Load .env file and the API key
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# FastAPI setup
app = FastAPI()

class TaskRequest(BaseModel):
    task: str

@app.post("/run-task")
async def run_task(req: TaskRequest):
    task = req.task
    api_key = os.getenv("OPENAI_API_KEY")
    print(api_key,"api_key")
    if not api_key:
        return {"status": "error", "message": "API Key is not set in the .env file!"}

    try:
        agent = Agent(task=task, llm=ChatOpenAI(model='gpt-4', api_key=api_key))
        await agent.run()
        return {"status": "done", "task": task}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Function to run the FastAPI server with optional logger
def run_agent_server_with_logger(logger=None):
    import uvicorn

    def log(msg):
        print(msg)
        if logger:
            logger(msg)

    log("🚀 Starting FastAPI server at http://localhost:8000 ...")
    uvicorn.run("BrowserUseMobile.agent_runner:app", host="0.0.0.0", port=8000, reload=False)
