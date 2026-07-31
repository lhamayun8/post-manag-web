from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
from typing import List, Dict
import json
import os 

class RAG:
    def __init__(self):
        try:
            os.makedirs("./chroma_db",exist_ok=True)
            self.model=SentenceTransformer('all-MiniLM-L6-v2')
            self.client=chromadb.PersistentClient(path="./chroma_db",settings=Settings(anonymized_telemetry=False))
            self.collection=self.client.get_or_create_collection(name="post-manag-app",metadata={"hnsw:space":"cosine"})
            count=self.collection.count()
            print("RAG is ready")
        except Exception as e:
            print(f"Error:{e}")
            raise

    def addpost(self,post_id:int,content:str,metadata:Dict):
        try:
            embedding=self.model.encode(content).tolist()
            self.collection.upsert(ids=[f"post_{post_id}"],embeddings=[embedding],metadatas=[metadata],documents=[content])
            return True
        except Exception as e:
            print(f"Error adding post:{e}")
            return False

    def search(self,query:str,limit:int=5,user_id:int=None)->List[Dict]:
        try:
            queryem=self.model.encode(query).tolist()
            results=self.collection.query(query_embeddings=[queryem],n_results=limit,include=["metadatas","documents","distances"])
            if not results['ids'] or not results['ids'][0]:
                return[]
            posts=[]
            for i in range(len(results["ids"][0])):
                metadata=results["metadatas"][0][i]
                score=1-results["distances"][0][i]
                if user_id and metadata.get("user_id")==user_id:
                    score+=0.1
                posts.append({
                    "content":results["documents"][0][i],"metadata":metadata,"score":score})
            posts.sort(key=lambda x:x["score"],reverse=True)
            return posts[:limit]
        except Exception as e:
            print(f"Error searching:{e}")
            return[]

    def semanticfeed(self,profile:str,limit:int=50)->List[Dict]:
        try:
            embedding=self.model.encode(profile).tolist()
            results = self.collection.query(
                query_embeddings=[embedding],
                n_results=limit,
                include=["metadatas", "documents", "distances"]
            )
            if not results["ids"] or not results["ids"][0]:
                return []
            posts = []
            for i in range(len(results["ids"][0])):
                similarity = 1 - results["distances"][0][i]
                posts.append({
                    "post_id": results["metadatas"][0][i]["id"],
                    "similarity": similarity,
                    "metadata": results["metadatas"][0][i],
                    "document": results["documents"][0][i]
                })
            posts.sort(key=lambda x: x["similarity"], reverse=True)
            return posts
        except Exception as e:
            print(f"Semantic search error: {e}")
            return []

rag=RAG()