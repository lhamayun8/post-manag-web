import React, { useState, useEffect, useRef } from 'react'

export default function Chatbot({ user }) {
    const [isOpen,setIsOpen]=useState(false)
    const [messages,setMessages]=useState([])
    const [input,setInput]=useState('')
    const [isLoading,setIsLoading]=useState(false)
    const [checkpointId,setCheckpointId]=useState(null)
    const messagesEndRef=useRef(null)
    const chatWindowRef=useRef(null)
    const[error,setError]=useState()
    const toggleChat=()=>{
        setIsOpen(!isOpen)
        if (!isOpen) {
            setCheckpointId(null)
        }
    }
    useEffect(()=>{
        scrollToBottom()
    },[messages])
    const scrollToBottom=()=>{
        setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end"
        })
    }, 100)
    }
    useEffect(()=>{
        const handleClickOutside=(event)=>{
            if (chatWindowRef.current && !chatWindowRef.current.contains(event.target)){
                if (!event.target.closest('.ai-assistant-toggle')){
                    setIsOpen(false)}}}
        document.addEventListener('mousedown',handleClickOutside)
        return()=>document.removeEventListener('mousedown',handleClickOutside)
    },[])
    const sendMessage=async()=>{
        if (!input.trim()||isLoading) 
            return
        const userMessage={role:'user',content:input }
        setMessages(prev=>[...prev,userMessage])
        setInput('')
        setIsLoading(true)
        try {
            let url=`http://localhost:8000/chat/stream/${encodeURIComponent(input)}`
            const params=new URLSearchParams()
            if(user?.id){
                params.append('user_id',user.id)}
            if(checkpointId){
                params.append('checkpoint_id',checkpointId)}
            if (params.toString()) {
                url+=`?${params.toString()}`}

            const res=await fetch(url,{headers:{'Accept': 'text/event-stream',}})
            const reader=res.body.getReader()
            const decoder=new TextDecoder()
            let bot={role:'assistant',content:'' }
            let add=false
            while(true){
                const{value,done}=await reader.read()
                if(done) 
                    break
                const chunk=decoder.decode(value)
                const lines=chunk.split('\n')
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data=JSON.parse(line.slice(6))
                            switch(data.type){
                                case 'checkpoint':
                                    setCheckpointId(data.checkpoint_id)
                                    break
                                case 'rag_results':
                                    setMessages(prev=>[...prev,{ 
                                            role:'system', 
                                            content:`📚 Found ${data.results.length} related posts on the platform`,
                                            isRAG:true,
                                            ragData:data.results}])
                                    break
                                case 'content':
                                    bot.content+=data.content
                                    if (!add){
                                        setMessages(prev=>[...prev,{ ...bot}])
                                        add=true
                                    }
                                    else{
                                        setMessages(prev => {
                                            const mes=[...prev]
                                            mes[mes.length - 1]={...bot}
                                            return mes
                                        })
                                    }
                                    break
                                case 'search_start':
                                    setMessages(prev=>[...prev,{role:'system',content:`Searching:${data.query}...` }])
                                    break
                                case 'search_results':
                                    const urls=JSON.parse(data.urls)
                                    if (urls.length>0) {
                                        setMessages(prev=>[...prev,{role:'system',content:`Found ${urls.length} web results`}])
                                    }
                                    break
                                case 'end':
                                    setIsLoading(false)
                                    break
                                default:
                                    break
                            }
                        } catch(err){
                            setError(err.response?.data?.detail || "Can not send message");
                        }
                    }
                }
            }
        }catch(error){
            setError(err.response?.data?.detail || "Can not send message.");
            setMessages(prev=>[...prev,{role:'system',content:'Error connecting to AI.Please try again.'}])
        }
        setIsLoading(false)
    }

    const handleKeyPress=(e)=>{
        if (e.key==='Enter'&&!e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }
    return (
        <>
            <button 
                className={`ai-assistant-toggle ${isOpen ? 'active' : ''}`}
                onClick={toggleChat}
                title="AI Assistant"
            >
                {isOpen?(
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ):(
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
                        <path d="M8 10h.01"></path>
                        <path d="M12 10h.01"></path>
                        <path d="M16 10h.01"></path>
                    </svg>
                )}
            </button>
            {isOpen && (
                <div className="ai-assistant-window" ref={chatWindowRef}>
                    <div className="ai-assistant-header">
                        <div className="header-content">
                            <div className="ai-icon">🤖</div>
                            <div>
                                <h3>AI Assistant</h3>
                                <span className="status">Online</span>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button onClick={toggleChat} className="close-btn" title="Close">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="ai-assistant-messages">
                        {messages.length===0 && (
                            <div className="welcome-message">
                                <div className="welcome-icon">👋</div>
                                <h4>Hello! I'm your AI Assistant</h4>
                                <p>I can help you with:</p>
                                <ul>
                                    <li>Finding interesting posts</li>
                                    <li>Discovering new people</li>
                                    <li>Answering questions</li>
                                    <li>Getting recommendations</li>
                                </ul>
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.role}`}>
                                <div className="message-content">
                                    <div className="message-avatar">
                                        {msg.role==='user'?'👤':msg.role==='assistant' ? '🤖' : 'ℹ️'}
                                    </div>
                                    <div className="message-text">
                                        {msg.content}
                                        {msg.isRAG && msg.ragData && (
                                            <div className="rag-results">
                                                {msg.ragData.map((item, i) => (
                                                    <div key={i} className="rag-item">
                                                        <span className="rag-score">
                                                            {Math.round(item.score * 100)}% match
                                                        </span>
                                                        <p>{item.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="message assistant">
                                <div className="message-content">
                                    <div className="message-avatar">🤖</div>
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-assistant-input">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask me anything..."
                            rows={1}
                            disabled={isLoading}
                        />
                        <button 
                            onClick={sendMessage} 
                            disabled={isLoading || !input.trim()}
                            className="send-btn"
                        >
                            {isLoading ? '...' : 'Send'}
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}