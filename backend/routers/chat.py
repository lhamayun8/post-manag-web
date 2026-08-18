from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from typing import TypedDict, Annotated, Optional, List, Dict
from langgraph.graph import add_messages, StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import HumanMessage, AIMessageChunk, SystemMessage
from langgraph.checkpoint.memory import MemorySaver
from fastapi import FastAPI, Query, Depends,APIRouter
from fastapi.responses import StreamingResponse
import json
from uuid import uuid4
from database import SessionLocal
from models import Posts, Users, Friendship, Conversation, Message, Notifcation
from rag import rag
import re
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import TypedDict, Annotated, Optional, List, Dict

load_dotenv()
router=APIRouter(prefix="/chat",tags=["chat"])
class State(TypedDict):
    messages:Annotated[list,add_messages]
    user_id:Optional[int]
    context:Optional[Dict]
    results:Optional[List]

llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash", temperature=0.3)
memory=MemorySaver()
llm_with_tools=llm

async def getrag(state:State)->Dict:
    messages=state.get("messages",[])
    user_id=state.get("user_id")
    last=None
    for msg in reversed(messages):
        if isinstance(msg,HumanMessage):
            last=msg.content
            break
    print("User query:",last)
    if not last:
        return{"messages":[],"results":[]}
    questionpatterns=[
        r'\bwhat\b', r'\bwho\b', r'\bwhere\b', r'\bwhen\b', r'\bwhy\b', r'\bhow\b',
        r'\bshow\b', r'\btell\b', r'\bfind\b', r'\bsearch\b', r'\blist\b',
        r'\bpost\b', r'\bcomment\b', r'\blike\b', r'\buser\b', r'\bfriend\b',
        r'\bprofile\b', r'\babout\b', r'\bexplain\b', r'\bdescribe\b'
    ]
    needrag=False
    for pattern in questionpatterns:
        if re.search(pattern,last.lower()):
            needrag=True
            break
    greetings="hi","hello","hey","how are you","good morning","good evening","good afternoon"
    is_greeting=last.lower().strip() in greetings
    if is_greeting:
        return{"messages":[],"results":[]}
    if not needrag:
        return{"messages":[],"results":[]}
    same=rag.search(last,limit=3,user_id=user_id)
    print("RAG Results:",same)
    if not same:
        return{"messages":[],"results":[]}
    ragcontext="Here are the relevant posts from platform\n\n"
    for i,post in enumerate(same,1):
        ragcontext+=f"{i}.{post['content'][:300]}\n"
        ragcontext+=f"(Relevance:{post['score']:.2f})\n\n"
    return{"messages":[SystemMessage(content=ragcontext)],"results":same}
    
async def model(state:State):
    messages=state.get("messages",[])
    user_id=state.get("user_id")
    system_prompt = SystemMessage(
        content="""You are PostManager AI assistant - a helpful guide for the PostManager social platform.

            IMPORTANT RULES:

            1. FOR GREETINGS AND CASUAL CONVERSATION:
            - Respond naturally and warmly
            - Do NOT use RAG context
            - Examples:
                User: hi → Assistant: Hello! How can I help you with PostManager today?
                User: how are you? → Assistant: I'm doing great! How can I assist you?

            2. FOR QUESTIONS ABOUT PLATFORM DATA:
            - ONLY use the provided RAG context
            - Never invent posts, users, or content
            - If RAG context doesn't contain the answer, say:
                "I couldn't find anything related to that in PostManager."

            3. RESPONSE FORMAT:
            - For profile questions: Show user info clearly
            - For posts: Show title, author, likes, comments
            - For friends: List friends with names
            - Be concise but informative

            4. PRIVACY:
            - NEVER access or discuss private messages
            - If asked about messages, say: "I cannot access private messages for privacy reasons."

            Remember: You are a helpful assistant for the PostManager platform!
            """
                )
    hassystem=any(isinstance(msg,SystemMessage) for msg in messages)
    if not hassystem:
        messages.insert(0,system_prompt)
    result=await llm_with_tools.ainvoke(messages)
    return{"messages":[result]}

graph=StateGraph(State)
graph.add_node("rag",getrag)
graph.add_node("model",model)
graph.set_entry_point("rag")
graph.add_edge("rag","model")
graph.add_edge("model",END)
newgraph=graph.compile(checkpointer=memory)
  
def serialisechunk(chunk):
    if not isinstance(chunk, AIMessageChunk):
        return ""
    content=chunk.content
    if isinstance(content,str):
        return content
    if isinstance(content,list):
        text=""
        for part in content:
            if isinstance(part,dict):
                text+=part.get("text","")
            elif hasattr(part,"text"):
                text+=part.text
            else:
                text+=str(part)
        return text
    return str(content)

async def generateresponse(message:str,user_id:Optional[int],checkpoint_id:Optional[str]=None):
    newconvo=checkpoint_id is None
    if newconvo:
        newid=str(uuid4())
        config={"configurable":{"thread_id":newid}}
        events = newgraph.astream_events({"messages":[HumanMessage(content=message)],"user_id":user_id},version="v2",config=config)
        yield "data: "+json.dumps({"type":"checkpoint","checkpoint_id":newid})+"\n\n"
    else:
        config={"configurable":{"thread_id":checkpoint_id}}
        events = newgraph.astream_events({"messages":[HumanMessage(content=message)],"user_id":user_id},version="v2",config=config)
    async for event in events:
        eventtype=event["event"]
        if eventtype=="on_chain_end" and event.get("name")=="rag":
            results=event["data"]["output"].get("results",[])
            if results:
                yield "data: "+json.dumps({"type":"rag_results","results":[{"id":r["metadata"]["id"],"content":r["content"],"score":r["score"]}
                                                                           for r in results[:3]]}) + "\n\n"
        if eventtype=="on_chat_model_stream":
            chunkcontent=serialisechunk(event["data"]["chunk"])
            yield "data: "+json.dumps({"type":"content","content":chunkcontent})+"\n\n"
        elif eventtype=="on_chat_model_end":
            output=event["data"]["output"]
            tool_calls=getattr(output,"tool_calls",[])
            searchcalls=[call for call in tool_calls if call["name"]=="tavily_search_results_json"]
            if searchcalls:
                searchquery=searchcalls[0]["args"].get("query","")
                yield "data: "+json.dumps({"type":"search_start","query":searchquery})+"\n\n"
        elif eventtype=="on_tool_end" and event["name"]=="tavily_search_results_json":
            output=event["data"]["output"]
            if isinstance(output,list):
                urls=[]
                for item in output:
                    if isinstance(item,dict) and "url" in item:
                        urls.append(item["url"])
                urlsjson=json.dumps(urls)
                yield f"data:{{\"type\":\"search_results\",\"urls\":\"{urlsjson}\"}}\n\n"

    yield "data: "+json.dumps({"type":"end"})+"\n\n"

@router.get("/stream/{message}")
async def chatstream(message:str,user_id:Optional[int]=Query(None),checkpoint_id:Optional[str]=Query(None)):
    return StreamingResponse(generateresponse(message,user_id,checkpoint_id),media_type="text/event-stream")