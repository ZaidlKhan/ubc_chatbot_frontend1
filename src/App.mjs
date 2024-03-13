import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import mainLogo from './logo.png';
import info from './info.png';
import deletebutton from './delete.png';
import Cookies from 'js-cookie';


  const WelcomeModal = ({ onClose }) => (
    <div className="welcome-overlay" onClick={onClose}>
      <div className="welcome-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-section">
          <h3>Examples</h3>
          <p>"What are prerequisite courses for CPSC 340?"</p>
          <p>"What are some courses about cell biology?"</p>
          <p>"What are some 300 level COGS courses?"</p>
        </div>
  
        <div className="modal-section">
          <h3>Capabilities</h3>
          <p>Remembers what user said earlier in the conversation</p>
          <p>Allows user to provide follow-up corrections</p>
          <p>Trained to decline inappropriate requests</p>
        </div>
  
        <div className="modal-section">
          <h3>Limitations</h3>
          <p>May occasionally generate incorrect information</p>
          <p>A max of 3 messages can be sent a daily</p>
          <p>Has limited knowledge specific to UBC</p>
        </div>
      </div>
    </div>
  );

const App = () => {
  const [messageCount, setMessageCount] = useState(parseInt(Cookies.get('messageCount') || 0));
  const [inputPlaceholder, setInputPlaceholder] = useState(() => {
    const messageCount = parseInt(Cookies.get('messageCount') || 0);
    return messageCount >= 3 ? "Maximum 3 messages allowed per day" : "Type your message here";
  });
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState('');
  const [previousChats, setPreviousChats] = useState([]);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    document.title = "UBC Science Chatbot";
  }, []);

  useEffect(() => {
    if (messageCount >= 3) {
      setIsInputDisabled(true)
    }
  }, []);

  
  useEffect(() => {
    scrollToBottom();
  }, [previousChats]);

  const reset = async () => {
    setPreviousChats([]);
    setValue("");
  };
  
  const getMessages = async () => {
    if (!value.trim() || messageCount >= 3) {
      setIsInputDisabled(true); 
      setInputPlaceholder("Maximum 3 messages allowed per day");
      return;
    }
  
    setIsLoading(true);
    const userMessage = { role: 'user', content: value };
    setPreviousChats(prevChats => [...prevChats, userMessage]);
    setValue('');
  
    try {
      const response = await axios.post("https://ubc-chatbot-backend1.onrender.com/api/init-chat/", { message: value });
      const serverMessage = { role: 'assistant', content: response.data.message };
      setPreviousChats(prevChats => [...prevChats, serverMessage]);
      setMessageCount(messageCount + 1);
      Cookies.set('messageCount', messageCount + 1, { expires: 1 });
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  
    setIsLoading(false);
  };

  const toggleWelcomeModal = () => {
    setShowWelcome(!showWelcome);
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
  
    window.addEventListener('resize', handleResize);
  
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <div className="app">
    <title>UBC Science Chatbot</title>
       <button onClick={toggleWelcomeModal} className="info-button">
        <img src={info} height={30}></img>
       </button>
      {showWelcome && <WelcomeModal onClose={toggleWelcomeModal} />}
      <div className='top-section'>
        <img src={mainLogo} alt="Main Logo" height={75} />
        <h3>{windowWidth <= 600 ? 'UBC Science Undergraduate Chatbot' : 'The Friendly UBC Science Undergraduate Chatbot'}</h3>
      </div>
      <section className="main">
        <ul className='feed'>
          {previousChats.map((chat, index) => (
            <li key={index} className={`message ${chat.role}`}>
              <p className='role'>{chat.role}</p>
              <p>{chat.content}</p>
              {index === previousChats.length - 1 ? <div ref={messagesEndRef} /> : null}
            </li>
          ))}
        </ul>
        <div className="bottom-section">
        <div className="input-container">
            <button onClick={reset} disabled={isLoading}>
            <img src={deletebutton} height={25} alt="Delete Icon" />
            </button>
            <input
              value={value}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isInputDisabled) {  
                  e.preventDefault();  
                  getMessages();  
                }
              }}
              onChange={(e) => setValue(e.target.value)}
              placeholder={isLoading ? "Thinking..." : isInputDisabled ? "Daily message limit reached" : "Type your message here"}
              disabled={isLoading || isInputDisabled}
            />
            {isLoading ? (
              <div className="lds-ring"><div></div><div></div><div></div><div></div></div>
            ) : (
              <div id="submit" onClick={getMessages} style={{ opacity: isLoading ? 0.5 : 1 }}>➢</div>
            )}
          </div>
          <p className="info"> 
          Please note that the information provided by this chatbot is based on available data and algorithms, and may not always be accurate. We recommend double-checking any critical information to ensure its reliability and accuracy. <strong>Maximum 3 messages are allowed per day.</strong> </p>
        </div>
      </section>
    </div>
  );
};

export default App;
